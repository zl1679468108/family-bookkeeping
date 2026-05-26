import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for GET /api/statistics/summary query parameters.
 */
export class SummaryQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}

/**
 * DTO for GET /api/statistics/monthly-trend query parameters.
 */
export class MonthlyTrendQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24)
  months?: number;

  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: 'income' | 'expense';
}

/**
 * DTO for GET /api/statistics/category-breakdown query parameters.
 */
export class CategoryBreakdownQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';
}
