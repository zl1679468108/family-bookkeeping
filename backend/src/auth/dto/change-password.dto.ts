import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码长度至少为 6 位' })
  @Matches(/((?=.*[a-z])(?=.*[A-Z])(?=.*\d)).*/, {
    message: '新密码必须同时包含大小写字母和数字',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirmPassword: string;
}
