import { IsOptional, IsString, IsIn, IsNumberString, IsBooleanString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUsersDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'deleted'])
  status?: string;
}

export class UpdateUserRoleDto {
  @IsIn(['user', 'admin'])
  role: string;

  @IsString()
  password: string; // 管理员输入自己的密码确认
}

export class UpdateUserStatusDto {
  @IsIn(['active', 'suspended', 'deleted'])
  status: string;

  @IsString()
  password: string; // 管理员输入自己的密码确认
}

export class QueryAdminTransactionsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  book_id?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;
}
