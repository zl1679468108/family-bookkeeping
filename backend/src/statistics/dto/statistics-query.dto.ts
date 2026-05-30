import { IsOptional, IsString, IsNumber, IsIn, Min, Max, Matches } from 'class-validator';
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
  @IsString()
  endDate?: string;

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

/**
 * DTO for GET /api/statistics/yoy-comparison query parameters.
 */
export class YoYComparisonQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  compareYear?: number;

  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: 'income' | 'expense';
}

/**
 * DTO for GET /api/statistics/daily-summary query parameters.
 * month format: YYYY-MM (e.g., 2026-05)
 */
export class DailySummaryQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: '月份格式必须为 YYYY-MM（如 2026-05）' })
  month: string;
}
