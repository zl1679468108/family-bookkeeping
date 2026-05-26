import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { StatisticsService } from './statistics.service';
import {
  SummaryQueryDto,
  MonthlyTrendQueryDto,
  CategoryBreakdownQueryDto,
} from './dto/statistics-query.dto';

@Controller('statistics')
@UseGuards(TokenAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /api/statistics/summary
   *
   * Returns income, expense, and balance for the requested date range together
   * with period-over-period changes.
   */
  @Get('summary')
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query() query: SummaryQueryDto,
  ) {
    const data = await this.statisticsService.getSummary(
      userId,
      query.startDate,
      query.endDate,
    );
    return { message: '获取统计概览成功', data };
  }

  /**
   * GET /api/statistics/monthly-trend
   *
   * Returns monthly aggregated amounts for the last N months.
   */
  @Get('monthly-trend')
  async getMonthlyTrend(
    @CurrentUser('id') userId: string,
    @Query() query: MonthlyTrendQueryDto,
  ) {
    const monthsNum = query.months ?? 6;
    const normalizedType: 'income' | 'expense' =
      query.type === 'income' ? 'income' : 'expense';
    const data = await this.statisticsService.getMonthlyTrend(
      userId,
      monthsNum,
      normalizedType,
    );
    return { message: '获取月度趋势成功', data };
  }

  /**
   * GET /api/statistics/category-breakdown
   *
   * Returns category breakdown with top-7 + "other" aggregation.
   */
  @Get('category-breakdown')
  async getCategoryBreakdown(
    @CurrentUser('id') userId: string,
    @Query() query: CategoryBreakdownQueryDto,
  ) {
    const normalizedType: 'income' | 'expense' =
      query.type === 'income' ? 'income' : 'expense';
    const data = await this.statisticsService.getCategoryBreakdown(
      userId,
      query.startDate,
      query.endDate,
      normalizedType,
    );
    return { message: '获取分类统计成功', data };
  }
}
