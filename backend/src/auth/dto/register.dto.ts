import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为6位' })
  password: string;

  @IsString()
  @MinLength(2, { message: '用户名长度至少为2位' })
  username: string;
}
