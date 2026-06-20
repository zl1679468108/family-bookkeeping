import { IsString, IsNumber, IsOptional, IsIn, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsIn(['income', 'expense'])
  @IsOptional()
  type?: 'income' | 'expense';

  @IsString()
  @IsISO8601()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  image_urls?: string;

  @IsString()
  @IsOptional()
  location_name?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  poi_id?: string;
}
