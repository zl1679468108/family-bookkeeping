import { IsString, IsNotEmpty } from 'class-validator';

/** 注销账号 DTO — 需二次确认密码 */
export class DeactivateDto {
  @IsString()
  @IsNotEmpty({ message: '请输入密码以确认注销' })
  password: string;
}
