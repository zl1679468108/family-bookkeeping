import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为 6 位' })
  password: string;

  @IsOptional()
  @IsString()
  token?: string; // 可选：客户端当前持有的 token

  @IsString({ message: '请输入验证码' })
  captchaCode: string;

  @IsString({ message: '验证码 ID 不能为空' })
  captchaId: string;
}