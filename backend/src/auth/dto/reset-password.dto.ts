import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: '密码至少需要6位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { 
    message: '密码必须包含字母和数字' 
  })
  password: string;
}
