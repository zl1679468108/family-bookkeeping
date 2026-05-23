import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TransactionFilters } from '../transaction/transaction.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * 导出为 Excel 文件
   */
  async exportToExcel(filters?: TransactionFilters): Promise<Buffer> {
    // 获取交易数据
    const transactions = await this.getTransactionData(filters);

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '家庭记账应用';
    workbook.created = new Date();

    // 创建工作表
    const worksheet = workbook.addWorksheet('交易记录', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // 设置列宽
    worksheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '类型', key: 'type', width: 10 },
      { header: '分类', key: 'category', width: 15 },
      { header: '金额', key: 'amount', width: 15 },
      { header: '备注', key: 'description', width: 30 },
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 填充数据
    transactions.forEach((item, index) => {
      const row = worksheet.addRow({
        date: item.date,
        type: item.type === 'income' ? '收入' : '支出',
        category: this.getCategoryName(item.category, item.type),
        amount: item.amount,
        description: item.description || '',
      });

      // 设置金额列格式
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('amount').alignment = { horizontal: 'right' };

      // 交替行颜色
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' },
        };
      }
    });

    // 生成缓冲区
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出为 PDF 文件
   */
  async exportToPDF(filters?: TransactionFilters): Promise<Buffer> {
    // 获取交易数据
    const transactions = await this.getTransactionData(filters);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 标题
      doc.fontSize(20).font('Helvetica-Bold').text('交易记录', { align: 'center' });
      doc.moveDown(0.5);

      // 导出时间
      doc.fontSize(10).font('Helvetica').fillColor('#666666');
      doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, { align: 'center' });
      doc.moveDown(1);

      // 表头
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
      doc.text('日期', 50, doc.y, { width: 80 });
      doc.text('类型', 130, doc.y, { width: 60 });
      doc.text('分类', 190, doc.y, { width: 80 });
      doc.text('金额', 350, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);

      // 分隔线
      doc.strokeColor('#DDDDDD').lineWidth(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // 数据行
      doc.fontSize(11).font('Helvetica').fillColor('#333333');

      transactions.forEach((item, index) => {
        // 检查是否需要换页
        if (doc.y > 750) {
          doc.addPage();
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
          doc.text('日期', 50, 50, { width: 80 });
          doc.text('类型', 130, 50, { width: 60 });
          doc.text('分类', 190, 50, { width: 80 });
          doc.text('金额', 350, 50, { width: 100, align: 'right' });
          doc.moveDown(0.5);
          doc.strokeColor('#DDDDDD').lineWidth(1);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
        }

        const y = doc.y;
        doc.text(item.date, 50, y, { width: 80 });
        doc.text(item.type === 'income' ? '收入' : '支出', 130, y, { width: 60 });
        doc.text(this.getCategoryName(item.category, item.type), 190, y, { width: 80 });
        doc.text(`¥${item.amount.toFixed(2)}`, 350, y, { width: 100, align: 'right' });

        doc.moveDown(0.4);

        // 添加备注
        if (item.description) {
          doc.fontSize(9).fillColor('#888888');
          doc.text(`备注: ${item.description}`, 50, doc.y, { width: 495 });
          doc.moveDown(0.3);
          doc.fontSize(11).fillColor('#333333');
        }
      });

      // 统计信息
      doc.moveDown(1);
      const stats = this.calculateStats(transactions);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
      doc.text('统计摘要', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(`总收入: ¥${stats.totalIncome.toFixed(2)}`);
      doc.text(`总支出: ¥${stats.totalExpense.toFixed(2)}`);
      doc.text(`结余: ¥${stats.balance.toFixed(2)}`);
      doc.text(`交易笔数: ${transactions.length}`);

      doc.end();
    });
  }

  /**
   * 获取交易数据
   */
  private async getTransactionData(filters?: TransactionFilters) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取交易数据失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 获取分类名称
   */
  private getCategoryName(category: string, type: string): string {
    const categoryMap: Record<string, Record<string, string>> = {
      income: {
        salary: '工资',
        bonus: '奖金',
        investment: '投资收益',
        other_income: '其他收入',
      },
      expense: {
        food: '餐饮',
        housing: '住房',
        transport: '交通',
        utilities: '水电燃气',
        shopping: '购物',
        entertainment: '娱乐',
        healthcare: '医疗',
        education: '教育',
        other_expense: '其他支出',
      },
    };

    return categoryMap[type]?.[category] || category || '其他';
  }

  /**
   * 计算统计数据
   */
  private calculateStats(transactions: any[]) {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += parseFloat(t.amount);
      } else {
        totalExpense += parseFloat(t.amount);
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
