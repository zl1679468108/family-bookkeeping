import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { TransactionFilters } from '../transaction/transaction.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出 Excel 文件
   */
  @Get('excel')
  async exportExcel(
    @Res() res: Response,
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
      throw new BadRequestException(
        `导出 Excel 失败: ${error.message}`,
      );
    }
  }

  /**
   * 导出 PDF 文件
   */
  @Get('pdf')
  async exportPdf(
    @Res() res: Response,
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
      throw new BadRequestException(
        `导出 PDF 失败: ${error.message}`,
      );
    }
  }
}
