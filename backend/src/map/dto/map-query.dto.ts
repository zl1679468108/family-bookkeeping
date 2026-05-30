import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MapTransactionsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  type?: 'income' | 'expense';

  @IsOptional()
  @IsString()
  categories?: string; // 逗号分隔的分类 ID（UUID）

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  /** P1 新增：逗号分隔的 user_id 列表，如 "uuid1,uuid2" */
  @IsOptional()
  @IsString()
  memberIds?: string;
}

export class MerchantQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  type?: 'income' | 'expense';

  /** P1 新增：逗号分隔的 user_id 列表，如 "uuid1,uuid2" */
  @IsOptional()
  @IsString()
  memberIds?: string;
}

export class MerchantTransactionsQueryDto {
  @IsOptional()
  @IsString()
  poi_id?: string;

  @IsOptional()
  @IsString()
  location_name?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
