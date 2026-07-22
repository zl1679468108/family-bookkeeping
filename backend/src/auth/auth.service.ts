import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { WechatService } from '../wechat/wechat.service';
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

/** 双 Token：访问令牌（短，请求携带）+ 刷新令牌（长，仅用于换发） */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type SafeUser = Omit<User, 'password_hash'>;

/** bcrypt 哈希成本因子（统一口径，避免散落硬编码） */
const BCRYPT_COST = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly captchaService: CaptchaService,
    private readonly wechatService: WechatService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const supabase = this.supabaseService.getClient();

    // UGC 内容安全检测（用户昵称）
    await this.wechatService.checkText(dto.username, 1);

    // 检查邮箱是否已注册
    const { data: existingUser } = await supabase
      .from('jj_users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    // 插入用户
    const { data: newUser, error } = await supabase
      .from('jj_users')
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

    const tokens = await this.createSessionInternal(newUser.id);
    return {
      user: newUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
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
  async switchAccount(
    dto: SwitchAccountDto,
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    // T-M13: token 失效时需要 captcha 验证，防止暴力破解
    if (!dto.token) {
      if (!dto.captchaId || !dto.captchaCode) {
        throw new UnauthorizedException('需要提供验证码');
      }
      const isCaptchaValid = this.captchaService.validate(dto.captchaId, dto.captchaCode);
      if (!isCaptchaValid) {
        throw new UnauthorizedException('验证码错误');
      }
    }
    return this.authenticateInternal(dto.email, dto.password, dto.token);
  }

  private async authenticateInternal(
    email: string,
    password: string,
    token?: string,
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('jj_users')
      .select('id, email, username, password_hash, avatar_url, current_book_id, role, status, created_at, updated_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // T-C2: 校验用户状态，暂停/禁用用户不允许登录
    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被暂停，请联系客服');
    }

    // token 此处为刷新令牌（长 token）：未过期则复用并签发新 access；否则创建新会话
    const tokens = token
      ? await this.reuseOrCreateSession(user.id, token)
      : await this.createSessionInternal(user.id);

    // 登录成功后更新 users 表的 updated_at，并取最新记录返回
    const { data: updatedUser } = await supabase
      .from('jj_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single();

    const { password_hash, ...userWithoutPassword } = updatedUser || user;
    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getUserById(id: string): Promise<SafeUser & { current_book_id?: string } | null> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('jj_users')
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
      .from('jj_users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // 不暴露用户是否存在，静默返回
      return;
    }

    const resetToken = this.tokenService.generateResetToken();

    const { error: resetInsertError } = await supabase
      .from('jj_password_resets')
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
    const { data: resetRecords } = await supabase
      .from('jj_password_resets')
      .select('id, user_id, expires_at, used_at')
      .eq('token', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    const resetRecord = resetRecords?.[0];

    if (!resetRecord) {
      throw new BadRequestException('无效或已过期的重置令牌');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    const { error: userUpdateError } = await supabase
      .from('jj_users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    if (userUpdateError) {
      throw new InternalServerErrorException(`重置密码失败：${userUpdateError.message}`);
    }

    const { error: resetUpdateError } = await supabase
      .from('jj_password_resets')
      .update({ used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    if (resetUpdateError) {
      throw new InternalServerErrorException(`更新重置令牌失败：${resetUpdateError.message}`);
    }

    // T-M14: 密码重置后销毁该用户所有 session
    await supabase
      .from('jj_user_sessions')
      .delete()
      .eq('user_id', resetRecord.user_id);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser | null> {
    const supabase = this.supabaseService.getClient();

    // UGC 内容安全检测（用户昵称）
    if (dto.username !== undefined) {
      await this.wechatService.checkText(dto.username, 1);
    }

    if (dto.email) {
      const { data: existingUser } = await supabase
        .from('jj_users')
        .select('id')
        .eq('email', dto.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new ConflictException('该邮箱已被使用');
      }
    }

    // 白名单字段，防止批量赋值
    const updatePayload: Record<string, string> = {};
    if (dto.username !== undefined) updatePayload.username = dto.username;
    if (dto.email !== undefined) updatePayload.email = dto.email;
    if (dto.avatar_url !== undefined) updatePayload.avatar_url = dto.avatar_url;

    const { data: updatedUser, error } = await supabase
      .from('jj_users')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, username, avatar_url, created_at, updated_at')
      .single();

    if (error || !updatedUser) {
      throw new InternalServerErrorException(error?.message || '更新用户信息失败');
    }

    return updatedUser;
  }

  async sendResetCode(email: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase
      .from('jj_users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return;
    }

    const code = this.generateVerificationCode();

    const { data: existingReset } = await supabase
      .from('jj_password_resets')
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

    const { error: insertError } = await supabase
      .from('jj_password_resets')
      .insert({
        user_id: user.id,
        token: this.tokenService.hashToken(resetToken),
        code: this.tokenService.hashToken(code),
        expires_at: this.tokenService.getResetCodeExpiresAt(),
      });

    if (insertError) {
      throw new InternalServerErrorException('验证码保存失败');
    }

    await this.mailService.sendVerificationCodeEmail(email, code);
  }

  // T-M17: 验证码失败次数追踪（内存存储，生产环境建议用 Redis）
  private resetCodeAttempts = new Map<string, { count: number; lockedUntil: number }>();
  private readonly RESET_CODE_MAX_ATTEMPTS = 5;
  private readonly RESET_CODE_LOCK_DURATION = 15 * 60 * 1000; // 15 分钟

  private checkResetCodeLock(email: string): void {
    const record = this.resetCodeAttempts.get(email);
    if (record && record.lockedUntil > Date.now()) {
      const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      throw new BadRequestException(`验证码错误次数过多，请 ${remaining} 分钟后重试`);
    }
  }

  private recordResetCodeFailure(email: string): void {
    const record = this.resetCodeAttempts.get(email) || { count: 0, lockedUntil: 0 };
    record.count++;
    if (record.count >= this.RESET_CODE_MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + this.RESET_CODE_LOCK_DURATION;
      record.count = 0; // 锁定后重置计数
    }
    this.resetCodeAttempts.set(email, record);
  }

  private clearResetCodeAttempts(email: string): void {
    this.resetCodeAttempts.delete(email);
  }

  async resetPasswordByCode(email: string, code: string, newPassword: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      throw new BadRequestException('验证码必须是 6 位数字');
    }

    // T-M17: 检查是否被锁定
    this.checkResetCodeLock(trimmedEmail);

    const { data: user } = await supabase
      .from('jj_users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (!user) {
      throw new BadRequestException('验证码错误');
    }

    const { data: resetRecords } = await supabase
      .from('jj_password_resets')
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

    if (resetRecord.code !== this.tokenService.hashToken(trimmedCode)) {
      // T-M17: 记录失败次数
      this.recordResetCodeFailure(trimmedEmail);
      throw new BadRequestException('验证码错误');
    }

    // T-M17: 验证码正确，清除失败记录
    this.clearResetCodeAttempts(trimmedEmail);

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    const { error: userUpdateError } = await supabase
      .from('jj_users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (userUpdateError) {
      throw new InternalServerErrorException(`重置密码失败：${userUpdateError.message}`);
    }

    const { error: resetUpdateError } = await supabase
      .from('jj_password_resets')
      .update({ used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    if (resetUpdateError) {
      throw new InternalServerErrorException(`更新验证码状态失败：${resetUpdateError.message}`);
    }

    // T-M14: 密码重置后销毁该用户所有 session
    await supabase
      .from('jj_user_sessions')
      .delete()
      .eq('user_id', user.id);
  }

  async logout(userId: string, tokenHash: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    if (!tokenHash) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const { error } = await supabase
      .from('jj_user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('token_hash', tokenHash);

    if (error) {
      throw new InternalServerErrorException(`退出登录失败：${error.message}`);
    }
  }

  private generateVerificationCode(): string {
    const code = randomInt(100000, 1000000);
    return code.toString();
  }

  /**
   * 复用或创建会话（双 Token）
   * clientRefreshToken 为刷新令牌（长 token）：未过期则在原会话行上签发新的 access，
   * refresh 保持不变（符合"长 token"语义）；若过期或不存在则抛错提示登录过期。
   */
  private async reuseOrCreateSession(
    userId: string,
    clientRefreshToken?: string,
  ): Promise<TokenPair> {
    if (!clientRefreshToken) {
      // 没有传递 refresh（正常登录场景），直接创建新会话
      return this.createSessionInternal(userId);
    }

    const supabase = this.supabaseService.getClient();
    const refreshHash = this.tokenService.hashToken(clientRefreshToken);

    // 检查该 refresh 是否未过期
    const { data: existingSession } = await supabase
      .from('jj_user_sessions')
      .select('id, refresh_expires_at')
      .eq('user_id', userId)
      .eq('refresh_token_hash', refreshHash)
      .gt('refresh_expires_at', new Date().toISOString())
      .single();

    if (existingSession) {
      // refresh 仍有效：签发新的 access，刷新过期时间，refresh 保持不变
      const accessToken = this.tokenService.generateAccessToken();
      const accessHash = this.tokenService.hashToken(accessToken);
      const { error: updateError } = await supabase
        .from('jj_user_sessions')
        .update({
          token_hash: accessHash,
          expires_at: this.tokenService.getAccessExpiresAt(),
        })
        .eq('id', existingSession.id);

      if (updateError) {
        // 更新 token 过期时间失败不应阻断流程
      }

      return { accessToken, refreshToken: clientRefreshToken };
    }

    // refresh 已过期或不存在，抛出错误提示登录过期
    throw new UnauthorizedException('登录状态已过期，请重新登录');
  }

  private async createSessionInternal(userId: string): Promise<TokenPair> {
    const supabase = this.supabaseService.getClient();
    const accessToken = this.tokenService.generateAccessToken();
    const accessHash = this.tokenService.hashToken(accessToken);
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshHash = this.tokenService.hashToken(refreshToken);
    const now = new Date();
    const { error } = await supabase.from('jj_user_sessions').insert({
      user_id: userId,
      token_hash: accessHash,
      refresh_token_hash: refreshHash,
      created_at: now.toISOString(),
      expires_at: this.tokenService.getAccessExpiresAt(),
      refresh_expires_at: this.tokenService.getRefreshExpiresAt(),
    });

    if (error) {
      throw new InternalServerErrorException(`创建会话失败：${error.message}`);
    }

    // T-L8: 创建新 session 后限制用户最多 5 个活跃 session
    try {
      await supabase.rpc('fn_limit_user_sessions', {
        p_user_id: userId,
        p_max_count: 5,
      });
    } catch {
      // 静默失败，不影响登录流程
    }

    return { accessToken, refreshToken };
  }

  /**
   * 刷新访问令牌（双 Token）
   * 使用长令牌（refresh）校验 → 签发新的短令牌（access）→ 返回两者。
   * 默认 refresh 不轮换（保持稳定，符合"长 token"语义）。
   */
  async refreshAuth(
    refreshToken: string,
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const supabase = this.supabaseService.getClient();
    const refreshHash = this.tokenService.hashToken(refreshToken);

    const { data: session, error } = await supabase
      .from('jj_user_sessions')
      .select('user_id, refresh_expires_at')
      .eq('refresh_token_hash', refreshHash)
      .gt('refresh_expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      throw new UnauthorizedException('刷新令牌无效或已过期，请重新登录');
    }

    const { data: user, error: userError } = await supabase
      .from('jj_users')
      .select('id, email, username, password_hash, avatar_url, current_book_id, role, status, created_at, updated_at')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('刷新令牌无效或已过期，请重新登录');
    }

    // T-C2: 拒绝非 active 用户
    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被暂停，请联系客服');
    }

    // 默认不轮换 refresh（保持稳定），仅签发新的 access token
    const accessToken = this.tokenService.generateAccessToken();
    const accessHash = this.tokenService.hashToken(accessToken);
    const { error: updateError } = await supabase
      .from('jj_user_sessions')
      .update({
        token_hash: accessHash,
        expires_at: this.tokenService.getAccessExpiresAt(),
      })
      .eq('refresh_token_hash', refreshHash);

    if (updateError) {
      throw new InternalServerErrorException(`刷新会话失败：${updateError.message}`);
    }

    const { password_hash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /** 为新注册用户自动创建 2 个默认分类 */
  private async ensureDefaultCategories(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const defaults = [
      { user_id: userId, name: '购物', icon: '🛒', type: 'expense', is_default: true, sort_order: 0 },
      { user_id: userId, name: '工资', icon: '💼', type: 'income', is_default: true, sort_order: 0 },
    ];

    const { error } = await supabase.from('jj_categories').insert(defaults);

    if (error) {
      this.logger.error(`创建默认分类失败 (user ${userId}): ${error.message}`);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('jj_users')
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

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    const { error: updateError } = await supabase
      .from('jj_users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (updateError) {
      throw new InternalServerErrorException(`修改密码失败：${updateError.message}`);
    }

    // T-M14: 密码修改后销毁该用户所有 session（除当前 session 外）
    await supabase
      .from('jj_user_sessions')
      .delete()
      .eq('user_id', userId);
  }

  /**
   * 验证用户密码 - 供其他模块调用
   * @returns true 密码正确，false 密码错误或用户不存在
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('jj_users')
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
      .from('jj_book_members')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (!member) {
      throw new BadRequestException('您不是该账本的成员');
    }

    const { error } = await supabase
      .from('jj_users')
      .update({ current_book_id: bookId })
      .eq('id', userId);

    if (error) {
      throw new InternalServerErrorException(`设置当前账本失败：${error.message}`);
    }
  }

  /**
   * 注销账号（软删除）
   * - 校验密码（防误操作）
   * - status → 'deleted'
   * - 清空 password_hash（写入随机不可逆字符串，避免后续误用）
   * - 清除该用户全部 session（含 refresh token）
   * - 数据保留（便于投诉/找回），但账号无法再登录
   */
  async deactivateAccount(userId: string, password: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('jj_users')
      .select('id, password_hash, status')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'active') {
      throw new BadRequestException('账号已被停用，无法注销');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('密码错误，注销失败');
    }

    // 写入一个不可逆向的随机哈希作为 password_hash（不能为空，避免 bcrypt.compare 抛错）
    const randomHash = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), BCRYPT_COST);

    const { error: updateError } = await supabase
      .from('jj_users')
      .update({
        status: 'deleted',
        password_hash: randomHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new InternalServerErrorException(`注销账号失败：${updateError.message}`);
    }

    // 清除该用户所有 session（access + refresh）
    await supabase
      .from('jj_user_sessions')
      .delete()
      .eq('user_id', userId);

    this.logger.log(`用户 ${userId} 已注销账号（软删除）`);
  }
}
