import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SwitchAccountDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为 6 位' })
  password: string;

  @IsOptional()
  @IsString()
  token?: string;
}
