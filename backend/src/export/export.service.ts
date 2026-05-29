import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TransactionFilters } from '../transaction/transaction.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

// 中文字体路径（PDF 中文渲染用）
const FONT_PATH = path.join(__dirname, '../../assets/fonts/NotoSansSC.ttf');
const FONT_REGISTERED = fs.existsSync(FONT_PATH);

// Emoji 字体路径（PDF 中文字体不含 emoji 字形，需单独注册）
const EMOJI_FONT_PATH = path.join(__dirname, '../../assets/fonts/NotoEmoji.ttf');
const EMOJI_FONT_REGISTERED = fs.existsSync(EMOJI_FONT_PATH);

// Emoji 字符检测正则（含带 variation selector 的组合 emoji）
const EMOJI_RE = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

@Injectable()
export class ExportService {
  private categoryCache: Map<string, { name: string; icon: string }> | null = null;
  private readonly logger = new Logger(ExportService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * 从数据库加载所有分类，构建 id→{name,icon} 映射
   */
  private async loadCategoryMap(): Promise<Map<string, { name: string; icon: string }>> {
    if (this.categoryCache) return this.categoryCache;

    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('categories').select('id,name,icon');
    
    const map = new Map<string, { name: string; icon: string }>();
    (data || []).forEach((c: any) => {
      map.set(c.id, { name: c.name, icon: c.icon });
    });

    this.categoryCache = map;
    return map;
  }

  /**
   * 获取分类展示文本（emoji + 中文名），根据 category UUID 查找
   */
  private async getCategoryDisplay(categoryId: string): Promise<string> {
    const map = await this.loadCategoryMap();
    const info = map.get(categoryId);
    if (info) return `${info.icon} ${info.name}`;
    return `📌 未知`;
  }

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
    for (const item of transactions) {
      const categoryDisplay = await this.getCategoryDisplay(item.category);
      const row = worksheet.addRow({
        date: item.date,
        type: item.type === 'income' ? '收入' : '支出',
        category: categoryDisplay,
        amount: item.amount,
        description: item.description || '',
      });

      // 设置金额列格式
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('amount').alignment = { horizontal: 'right' };

      // 交替行颜色
      const rowIndex = transactions.indexOf(item);
      if (rowIndex % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' },
        };
      }
    }

    // 生成缓冲区
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出为 PDF 文件
   */
  async exportToPDF(filters?: TransactionFilters): Promise<Buffer> {
    const transactions = await this.getTransactionData(filters);
    const categoryMap = await this.loadCategoryMap();

    // 同步版本的分类展示函数（数据已在 Promise 外加载好，按 UUID 查找）
    const getDisplay = (categoryId: string): string => {
      const info = categoryMap.get(categoryId);
      if (info) return `${info.icon} ${info.name}`;
      return `📌 未知`;
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // 注册中文字体
      const useChinese = FONT_REGISTERED;
      if (useChinese) {
        try {
          doc.registerFont('Chinese', FONT_PATH);
          this.logger.log('中文字体注册成功');
        } catch (e) {
          this.logger.warn('中文字体注册失败，PDF 中文可能乱码');
        }
      }

      // 注册 Emoji 字体
      const useEmoji = EMOJI_FONT_REGISTERED;
      if (useEmoji) {
        try {
          doc.registerFont('Emoji', EMOJI_FONT_PATH);
          this.logger.log('Emoji 字体注册成功');
        } catch (e) {
          this.logger.warn('Emoji 字体注册失败');
        }
      }

      const font = (name: string) => useChinese ? 'Chinese' : name;

      /**
       * 混合文本渲染：自动将 emoji + 中文分段，用不同字体渲染在同一行
       * - emoji 段用 NotoEmoji 字体
       * - 其他字符用 Chinese 字体
       */
      const textMixed = (text: string, x: number, y: number, opts: {
        width?: number;
        fontSize?: number;
        color?: string;
      } = {}) => {
        const { fontSize: fs = 10, color = '#333333', width: maxW } = opts;
        doc.fontSize(fs).fillColor(color);

        // 将文本按 emoji 边界切分成段落
        const segments: { text: string; isEmoji: boolean }[] = [];
        let lastIdx = 0;
        let match: RegExpExecArray | null;
        const emojiRe = new RegExp(EMOJI_RE.source, 'gu');

        while ((match = emojiRe.exec(text)) !== null) {
          // emoji 之前的普通文字
          if (match.index > lastIdx) {
            segments.push({ text: text.slice(lastIdx, match.index), isEmoji: false });
          }
          // emoji 本身
          segments.push({ text: match[0], isEmoji: true });
          lastIdx = match.index + match[0].length;
        }
        // 尾部剩余文字
        if (lastIdx < text.length) {
          segments.push({ text: text.slice(lastIdx), isEmoji: false });
        }

        // 如果没有分段，整段渲染
        if (segments.length === 0) {
          segments.push({ text, isEmoji: false });
        }

        let xPos = x;
        const emojiFont = useEmoji ? 'Emoji' : font('Helvetica');
        const chineseFont = font('Helvetica');

        for (const seg of segments) {
          doc.font(seg.isEmoji ? emojiFont : chineseFont).fillColor(color);
          const segWidth = doc.widthOfString(seg.text);

          // 超出最大宽度则停止
          if (maxW && xPos + segWidth > x + maxW) break;

          doc.text(seg.text, xPos, y, { width: segWidth + 2, lineBreak: false });
          xPos += segWidth;
        }
      };

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 页面可用宽度 A4 (595pt) - 左右边距 (50+50) = 495pt
      const pageWidth = 495;

      // 标题 — PDFKit 的 align:'center' 需要显式 width 才能正确居中
      doc.fontSize(20).font(font('Helvetica-Bold'));
      doc.text('交易记录', 50, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(0.5);

      // 导出时间
      doc.fontSize(10).font(font('Helvetica')).fillColor('#666666');
      doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 50, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(1);

      // 表头
      doc.fontSize(12).font(font('Helvetica-Bold')).fillColor('#333333');
      const headerY = doc.y;
      doc.text('日期', 50, headerY, { width: 80 });
      doc.text('类型', 135, headerY, { width: 40 });
      doc.text('分类', 180, headerY, { width: 100 });
      doc.text('金额', 280, headerY, { width: 80, align: 'right' });
      doc.text('备注', 360, headerY, { width: 185 });
      doc.moveDown(0.5);

      // 分隔线
      doc.strokeColor('#DDDDDD').lineWidth(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // 数据行
      doc.fontSize(10).font(font('Helvetica')).fillColor('#333333');

      for (const item of transactions) {
        if (doc.y > 750) {
          doc.addPage();
          doc.fontSize(12).font(font('Helvetica-Bold')).fillColor('#333333');
          const phY = 50;
          doc.text('日期', 50, phY, { width: 80 });
          doc.text('类型', 135, phY, { width: 40 });
          doc.text('分类', 180, phY, { width: 100 });
          doc.text('金额', 280, phY, { width: 80, align: 'right' });
          doc.text('备注', 360, phY, { width: 185 });
          doc.moveDown(0.5);
          const sepY = doc.y;
          doc.strokeColor('#DDDDDD').lineWidth(1);
          doc.moveTo(50, sepY).lineTo(545, sepY).stroke();
          doc.moveDown(0.5);
          doc.fontSize(10).font(font('Helvetica')).fillColor('#333333');
        }

        const y = doc.y;
        // 使用同步 getDisplay 兼容旧英文 key + 新中文名称
        const categoryDisplay = getDisplay(item.category);

        doc.text(item.date, 50, y, { width: 80 });
        doc.text(item.type === 'income' ? '收入' : '支出', 135, y, { width: 40 });
        // 分类列使用混合字体渲染（emoji + 中文）
        textMixed(categoryDisplay, 180, y, { fontSize: 10, width: 100 });
        doc.text(`¥${parseFloat(String(item.amount)).toFixed(2)}`, 280, y, { width: 80, align: 'right' });
        // 备注放在同行右侧，过长自动截断
        const desc = item.description || '';
        doc.text(desc.length > 18 ? desc.slice(0, 18) + '…' : desc, 360, y, { width: 185, lineBreak: false });
        doc.moveDown(0.5);
      }

      // 统计信息
      doc.moveDown(1);
      const stats = this.calculateStats(transactions);
      doc.fontSize(12).font(font('Helvetica-Bold')).fillColor('#333333');
      doc.text('统计摘要', { underline: true });
      doc.moveDown(0.5);
      doc.font(font('Helvetica')).fontSize(10);
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

    if (filters?.bookId) {
      query = query.eq('book_id', filters.bookId);
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
