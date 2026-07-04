import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { TransactionFilters } from '../transaction/transaction.service';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { RateLimitGuard } from '../auth/rate-limit.guard';

@Controller('export')
@UseGuards(TokenAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出 Excel 文件
   */
  @Get('excel')
  @UseGuards(new RateLimitGuard(60_000, 3))
  async exportExcel(
    @Res() res: Response,
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const filters: TransactionFilters = {
        type,
        category,
        startDate,
        endDate,
        userId,
        bookId,
      };

      const buffer = await this.exportService.exportToExcel(filters);
      const filename = `transactions_${Date.now()}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      // B-L4: 区分错误类型，不统一包装为 BadRequestException
      if (error instanceof BadRequestException) throw error;
      if (error.message?.includes('超过上限')) throw error;
      // 数据库/网络错误 → 503
      if (error.message?.includes('获取交易数据')) {
        throw new InternalServerErrorException(`导出 Excel 失败: 服务器错误`);
      }
      throw new InternalServerErrorException(`导出 Excel 失败: ${error.message}`);
    }
  }

  /**
   * 导出 PDF 文件
   */
  @Get('pdf')
  @UseGuards(new RateLimitGuard(60_000, 3))
  async exportPdf(
    @Res() res: Response,
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const filters: TransactionFilters = {
        type,
        category,
        startDate,
        endDate,
        userId,
        bookId,
      };

      const buffer = await this.exportService.exportToPDF(filters);
      const filename = `transactions_${Date.now()}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.message?.includes('超过上限')) throw error;
      if (error.message?.includes('获取交易数据')) {
        throw new InternalServerErrorException(`导出 PDF 失败: 服务器错误`);
      }
      throw new InternalServerErrorException(`导出 PDF 失败: ${error.message}`);
    }
  }
}
