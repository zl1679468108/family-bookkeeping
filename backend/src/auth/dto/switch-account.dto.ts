import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SwitchAccountDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为 6 位' })
  password: string;

  // 双 Token：此处为刷新令牌（长 token），用于免验证码复用会话；
  // 不传或已过期则需提供 captcha 走正常登录流程
  @IsOptional()
  @IsString()
  token?: string;

  // T-M13: 可选 captcha 字段，token 失效时需要提供
  @IsOptional()
  @IsString()
  captchaId?: string;

  @IsOptional()
  @IsString()
  captchaCode?: string;
}
