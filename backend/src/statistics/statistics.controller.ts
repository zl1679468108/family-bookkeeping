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
} from './dto/statistics-query.dto';

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
    );
    return { message: '获取年度对比成功', data };
  }
}
