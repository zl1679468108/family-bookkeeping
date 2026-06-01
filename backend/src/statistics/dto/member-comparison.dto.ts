import { IsString, Matches } from 'class-validator';

/**
 * DTO for GET /api/statistics/member-comparison query parameters.
 * month_from / month_to format: YYYY-MM (e.g., "2026-05")
 */
export class MemberComparisonQueryDto {
  @IsString()
  book_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month_from 格式必须为 YYYY-MM（如 2026-05）' })
  month_from: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month_to 格式必须为 YYYY-MM（如 2026-05）' })
  month_to: string;
}
