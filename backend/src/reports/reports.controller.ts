import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { ReportsService } from './reports.service';
import { AnnualReportQueryDto } from './dto/annual-report-query.dto';

@Controller('reports')
@UseGuards(TokenAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('annual')
  async getAnnualReport(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: AnnualReportQueryDto,
  ) {
    const data = await this.reportsService.getAnnualReport(
      query.year,
      bookId,
      userId,
    );
    return { message: '获取年度报告成功', data };
  }
}
