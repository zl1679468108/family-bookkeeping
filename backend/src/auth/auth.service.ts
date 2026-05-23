import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface UpdateProfileDto {
  username?: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
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
      throw new Error('用户注册失败: ' + error.message);
    }

    const token = this.generateToken(newUser.id, newUser.email);
    return { user: newUser, token };
  }

  async login(dto: LoginDto): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', dto.email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const token = this.generateToken(user.id, user.email);
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, created_at')
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

    // 生成重置令牌并保存到数据库
    const resetToken = this.jwtService.sign(
      { sub: user.id, email, purpose: 'reset-password' },
      { expiresIn: '1h' },
    );

    await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

    await this.mailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    try {
      const decoded = this.jwtService.verify(token) as { sub: string; purpose: string };
      
      if (decoded.purpose !== 'reset-password') {
        throw new BadRequestException('无效的重置令牌');
      }

      const { data: resetRecord, error: recordError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .single();

      if (recordError || !resetRecord) {
        throw new BadRequestException('无效的重置令牌');
      }

      if (resetRecord.used_at) {
        throw new BadRequestException('令牌已被使用');
      }

      const expiresAt = new Date(resetRecord.expires_at);
      if (expiresAt < new Date()) {
        throw new BadRequestException('令牌已过期');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', decoded.sub);

      await supabase
        .from('password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('无效的重置令牌');
      }
      throw error;
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<User, 'password_hash'> | null> {
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

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(dto)
      .eq('id', userId)
      .select('id, email, username, created_at')
      .single();

    if (error || !updatedUser) {
      return null;
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

    const resetToken = this.jwtService.sign(
      { sub: user.id, email, purpose: 'reset-password' },
      { expiresIn: '5m' },
    );

    await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: resetToken,
        code: code,
        expires_at: new Date(Date.now() + 300000).toISOString(),
      });

    await this.mailService.sendVerificationCodeEmail(email, code);
  }

  async resetPasswordByCode(email: string, code: string, newPassword: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    console.log('=== 验证码验证调试 ===');
    console.log('输入的邮箱:', trimmedEmail);
    console.log('输入的验证码:', trimmedCode);
    console.log('验证码长度:', trimmedCode.length);

    if (!trimmedCode || trimmedCode.length !== 6) {
      throw new BadRequestException('验证码必须是6位数字');
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    console.log('查询到的用户:', user);

    if (!user) {
      throw new BadRequestException('验证码错误');
    }

    const { data: resetRecords, error: listError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('用户的密码重置记录:', resetRecords);

    const { data: resetRecord, error: recordError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('最新的重置记录:', resetRecord);
    console.log('数据库中的验证码:', resetRecord?.code);

    if (!resetRecord) {
      throw new BadRequestException('请先获取验证码');
    }

    if (resetRecord.code !== trimmedCode) {
      throw new BadRequestException('验证码错误');
    }

    console.log('查询错误:', recordError);

    if (resetRecord.used_at) {
      throw new BadRequestException('验证码已被使用');
    }

    const expiresAt = new Date(resetRecord.expires_at);
    if (expiresAt < new Date()) {
      throw new BadRequestException('验证码已过期');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}