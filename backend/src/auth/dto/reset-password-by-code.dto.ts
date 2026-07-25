import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordByCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '验证码不能为空' })
  code: string;

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  password: string;

  @IsString({ message: '确认密码不能为空' })
  confirmPassword: string;
}
