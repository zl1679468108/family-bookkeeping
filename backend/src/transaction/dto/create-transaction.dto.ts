import { IsString, IsNumber, IsOptional, IsIn, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  category: string;

  @IsString()
  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @IsString()
  @IsISO8601()
  date: string;

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
