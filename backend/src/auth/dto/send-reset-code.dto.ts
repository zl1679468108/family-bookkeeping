import { IsEmail } from 'class-validator';

export class SendResetCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}
