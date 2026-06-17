import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

/** 将空字符串、纯空白字符串转为 undefined，避免误作为筛选条件 */
const emptyToUndefined = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
};

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
  @Transform(({ value }) => emptyToUndefined(value))
  search?: string;

  @IsOptional()
  @IsIn(['income', 'expense'])
  @Transform(({ value }) => emptyToUndefined(value))
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  user_id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  book_id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  date_from?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  date_to?: string;
}
