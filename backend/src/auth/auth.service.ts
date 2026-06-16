import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { SwitchAccountDto } from './dto/switch-account.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CaptchaService } from './captcha.service';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'deleted';
  current_book_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface UpdateProfileDto {
  username?: string;
  email?: string;
  avatar_url?: string;
}

type SafeUser = Omit<User, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly captchaService: CaptchaService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: SafeUser; token: string }> {
    const supabase = this.supabaseService.getClient();

    // 检查邮箱是否已注册
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 插入用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: dto.email,
        username: dto.username,
        password_hash: passwordHash,
      })
      .select('id, email, username, created_at')
      .single();

    if (error) {
      throw new InternalServerErrorException(`用户注册失败：${error.message}`);
    }

    // 自动创建默认分类（账本由前端引导用户自行创建，或通过邀请加入）
    await this.ensureDefaultCategories(newUser.id);

    const token = await this.createSessionInternal(newUser.id);
    return { user: newUser, token };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; token: string }> {
    // 先校验验证码
    const isCaptchaValid = this.captchaService.validate(dto.captchaId, dto.captchaCode);
    if (!isCaptchaValid) {
      throw new BadRequestException('验证码错误');
    }

    return this.authenticateInternal(dto.email, dto.password, dto.token);
  }

  /**
   * 切换账号登录（免于验证码校验）
   * 仅使用已保存的账号密码（+ token）进行身份验证；密码错误或 token 过期均返回
   * 统一的 "邮箱或密码错误" 错误，由前端回退到带验证码的正常登录流程
   */
  async switchAccount(dto: SwitchAccountDto): Promise<{ user: SafeUser; token: string }> {
    return this.authenticateInternal(dto.email, dto.password, dto.token);
  }

  private async authenticateInternal(
    email: string,
    password: string,
    token?: string,
  ): Promise<{ user: SafeUser; token: string }> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 如果客户端传递了 token，检查是否未过期，如果未过期则复用
    const newToken = token
      ? await this.reuseOrCreateSession(user.id, token)
      : await this.createSessionInternal(user.id);

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token: newToken };
  }

  async getUserById(id: string): Promise<SafeUser & { current_book_id?: string } | null> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, avatar_url, role, status, created_at, current_book_id')
      .eq('id', id)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // 不暴露用户是否存在，静默返回
      return;
    }

    const resetToken = this.tokenService.generateResetToken();

    const { error: resetInsertError } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: this.tokenService.hashToken(resetToken),
        expires_at: this.tokenService.getResetTokenExpiresAt(),
      });

    if (resetInsertError) {
      throw new InternalServerErrorException(`创建重置令牌失败：${resetInsertError.message}`);
    }

    await this.mailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const tokenHash = this.tokenService.hashToken(token);
    console.log('[AuthService] Token hash:', tokenHash);
    const { data: resetRecords } = await supabase
      .from('password_resets')
      .select('id, user_id, expires_at, used_at')
      .eq('token', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    const resetRecord = resetRecords?.[0];

    if (!resetRecord) {
      throw new BadRequestException('无效或已过期的重置令牌');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    if (userUpdateError) {
      throw new InternalServerErrorException(`重置密码失败：${userUpdateError.message}`);
    }

    const { error: resetUpdateError } = await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    if (resetUpdateError) {
      throw new InternalServerErrorException(`更新重置令牌失败：${resetUpdateError.message}`);
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser | null> {
    const supabase = this.supabaseService.getClient();

    if (dto.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', dto.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new ConflictException('该邮箱已被使用');
      }
    }

    // 清理 payload：如果 avatar_url 太长（base64），截断日志输出
    const logDto = { ...dto };
    if (logDto.avatar_url && logDto.avatar_url.length > 100) {
      logDto.avatar_url = logDto.avatar_url.substring(0, 100) + '... (base64, length: ' + dto.avatar_url!.length + ')';
    }
    console.log('updateProfile payload:', logDto);

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(dto)
      .eq('id', userId)
      .select('id, email, username, avatar_url, created_at, updated_at')
      .single();

    if (error || !updatedUser) {
      console.error('Supabase update error:', error);
      throw new InternalServerErrorException(error?.message || '更新用户信息失败');
    }

    return updatedUser;
  }

  async sendResetCode(email: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return;
    }

    const code = this.generateVerificationCode();

    const { data: existingReset } = await supabase
      .from('password_resets')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingReset) {
      const createdAt = new Date(existingReset.created_at);
      const now = new Date();
      if (now.getTime() - createdAt.getTime() < 60000) {
        throw new BadRequestException('发送过于频繁，请稍后再试');
      }
    }

    const resetToken = this.tokenService.generateResetToken();

    await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: this.tokenService.hashToken(resetToken),
        code: code,
        expires_at: this.tokenService.getResetCodeExpiresAt(),
      });

    await this.mailService.sendVerificationCodeEmail(email, code);
  }

  async resetPasswordByCode(email: string, code: string, newPassword: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      throw new BadRequestException('验证码必须是 6 位数字');
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (!user) {
      throw new BadRequestException('验证码错误');
    }

    const { data: resetRecords } = await supabase
      .from('password_resets')
      .select('id, code, expires_at, used_at')
      .eq('user_id', user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const resetRecord = resetRecords?.[0];

    if (!resetRecord) {
      throw new BadRequestException('请先获取验证码或验证码已过期');
    }

    if (resetRecord.code !== trimmedCode) {
      throw new BadRequestException('验证码错误');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (userUpdateError) {
      throw new InternalServerErrorException(`重置密码失败：${userUpdateError.message}`);
    }

    const { error: resetUpdateError } = await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    if (resetUpdateError) {
      throw new InternalServerErrorException(`更新验证码状态失败：${resetUpdateError.message}`);
    }
  }

  async logout(userId: string, tokenHash: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    if (!tokenHash) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('token_hash', tokenHash);

    if (error) {
      throw new InternalServerErrorException(`退出登录失败：${error.message}`);
    }
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 复用或创建会话
   * 如果客户端传递的 token 未过期，则更新过期时间并返回原 token
   * 否则创建新 token
   */
  private async reuseOrCreateSession(userId: string, clientToken: string): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const tokenHash = this.tokenService.hashToken(clientToken);
    
    // 检查该 token 是否未过期
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSession) {
      // token 未过期，更新过期时间并返回原 token
      const newExpiresAt = this.tokenService.getSessionExpiresAt();
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ expires_at: newExpiresAt })
        .eq('id', existingSession.id);
      
      if (updateError) {
        console.error('[AuthService] 更新 token 过期时间失败:', updateError.message);
      } else {
        console.log('[AuthService] 复用未过期的 token for user:', userId);
      }
      
      return clientToken; // 返回原 token
    }

    // token 已过期或不存在，创建新 token
    console.log('[AuthService] token 已过期，创建新 token for user:', userId);
    return this.createSessionInternal(userId);
  }

  private async createSessionInternal(userId: string): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const token = this.tokenService.generateSessionToken();
    const tokenHash = this.tokenService.hashToken(token);
    console.log('[AuthService] Token hash:', tokenHash);
    const { error } = await supabase.from('user_sessions').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: this.tokenService.getSessionExpiresAt(),
    });

    if (error) {
      throw new InternalServerErrorException(`创建会话失败：${error.message}`);
    }

    return token;
  }

  /** 为新注册用户自动创建默认账本 */
  private async ensureDefaultBook(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: book, error } = await supabase
      .from('books')
      .insert({ name: '默认账本', owner_id: userId })
      .select('id')
      .single();

    if (error) {
      // 默认账本创建失败不应阻塞注册流程
      console.error(`创建默认账本失败 (user ${userId}):`, error.message);
      return;
    }

    await supabase.from('book_members').insert({
      book_id: book.id,
      user_id: userId,
      role: 'owner',
    });
  }

  /** 为新注册用户自动创建 2 个默认分类 */
  private async ensureDefaultCategories(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const defaults = [
      { user_id: userId, name: '购物', icon: '🛒', type: 'expense', is_default: true, sort_order: 0 },
      { user_id: userId, name: '工资', icon: '💼', type: 'income', is_default: true, sort_order: 0 },
    ];

    const { error } = await supabase.from('categories').insert(defaults);

    if (error) {
      console.error(`创建默认分类失败 (user ${userId}):`, error.message);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (updateError) {
      throw new InternalServerErrorException(`修改密码失败：${updateError.message}`);
    }
  }

  /**
   * 验证用户密码 - 供其他模块调用
   * @returns true 密码正确，false 密码错误或用户不存在
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    return bcrypt.compare(password, user.password_hash);
  }

  /** 设置当前账本 */
  async setCurrentBook(userId: string, bookId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 验证用户是否是账本成员
    const { data: member } = await supabase
      .from('book_members')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (!member) {
      throw new BadRequestException('您不是该账本的成员');
    }

    const { error } = await supabase
      .from('users')
      .update({ current_book_id: bookId })
      .eq('id', userId);

    if (error) {
      throw new InternalServerErrorException(`设置当前账本失败：${error.message}`);
    }
  }
}
