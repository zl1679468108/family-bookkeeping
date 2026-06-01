import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { StatisticsService } from './statistics.service';
import {
  SummaryQueryDto,
  MonthlyTrendQueryDto,
  CategoryBreakdownQueryDto,
  YoYComparisonQueryDto,
  DailySummaryQueryDto,
} from './dto/statistics-query.dto';
import { MemberComparisonQueryDto } from './dto/member-comparison.dto';

@Controller('statistics')
@UseGuards(TokenAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('summary')
  async getSummary(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: SummaryQueryDto,
  ) {
    const data = await this.statisticsService.getSummary(
      userId,
      query.startDate,
      query.endDate,
      bookId,
    );
    return { message: '获取统计概览成功', data };
  }

  @Get('monthly-trend')
  async getMonthlyTrend(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MonthlyTrendQueryDto,
  ) {
    const monthsNum = query.months ?? 6;
    const normalizedType: 'income' | 'expense' =
      query.type === 'income' ? 'income' : 'expense';
    const data = await this.statisticsService.getMonthlyTrend(
      userId,
      monthsNum,
      normalizedType,
      bookId,
      query.endDate,
    );
    return { message: '获取月度趋势成功', data };
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: CategoryBreakdownQueryDto,
  ) {
    const normalizedType: 'income' | 'expense' =
      query.type === 'income' ? 'income' : 'expense';
    const data = await this.statisticsService.getCategoryBreakdown(
      userId,
      query.startDate,
      query.endDate,
      normalizedType,
      bookId,
    );
    return { message: '获取分类统计成功', data };
  }

  @Get('yoy-comparison')
  async getYearOverYear(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: YoYComparisonQueryDto,
  ) {
    const data = await this.statisticsService.getYearOverYear(
      userId,
      query.year,
      query.type,
      bookId,
      query.compareYear,
    );
    return { message: '获取年度对比成功', data };
  }

  /**
   * GET /api/statistics/member-comparison
   *
   * 多成员消费对比：按 user_id + category 分组聚合指定月份范围内的支出。
   */
  @Get('member-comparison')
  async getMemberComparison(
    @CurrentUser('id') userId: string,
    @Query() query: MemberComparisonQueryDto,
  ) {
    return {
      message: '获取成员对比成功',
      data: await this.statisticsService.getMemberComparison(userId, query),
    };
  }

  /**
   * GET /api/statistics/daily-summary?month=YYYY-MM
   *
   * 返回当月每天的收入/支出/交易笔数汇总。
   * book_id 通过 x-book-id 请求头可选传入。
   */
  @Get('daily-summary')
  async getDailySummary(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: DailySummaryQueryDto,
  ) {
    const data = await this.statisticsService.getDailySummary(
      userId,
      query.month,
      bookId,
    );
    return { message: '获取每日汇总成功', data };
  }
}
