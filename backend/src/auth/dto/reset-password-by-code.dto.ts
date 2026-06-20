import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordByCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '验证码不能为空' })
  code: string;

  @IsString()
  @MinLength(6, { message: '密码至少需要6位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: '密码必须包含字母和数字',
  })
  password: string;

  @IsString({ message: '确认密码不能为空' })
  confirmPassword: string;
}
