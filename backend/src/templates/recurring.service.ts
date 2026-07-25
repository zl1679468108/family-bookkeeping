import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TemplatesService } from './templates.service';
import { Template } from './templates.service';
import { getBeijingDate } from '../common/utils/time.util';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly templatesService: TemplatesService,
  ) {}

  /**
   * 計算週期模板下次應該執行的日期
   */
  private getNextExecutionDate(template: Template): string {
    const today = getBeijingDate()
    // 從未執行過且今天已到開始日期：當日直接執行
    if (!template.last_executed_at && template.start_date && template.start_date <= today) {
      return today
    }

    const baseDate = template.last_executed_at
      ? new Date(template.last_executed_at)
      : new Date(template.start_date!)

    let nextDate: Date
    switch (template.frequency) {
      case 'daily':
        nextDate = new Date(baseDate)
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate = new Date(baseDate)
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'monthly':
        nextDate = new Date(baseDate)
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate = new Date(baseDate)
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case 'yearly':
        nextDate = new Date(baseDate)
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
      default:
        return today
    }
    // 用北京时间输出，避免 UTC 偏移
    return nextDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  }

  /**
   * 執行單個週期模板
   */
  async executeRecurring(templateId: string, userId: string): Promise<any> {
    const supabase = this.supabaseService.getClient()

    // 讀取模板
    const { data: template, error } = await supabase
      .from('jj_transaction_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single()

    if (error || !template) {
      throw new NotFoundException('template not found')
    }

    if (!template.frequency) {
      throw new BadRequestException('this template is not recurring')
    }

    // 檢查是否已過結束日期（北京时间比较）
    const today = getBeijingDate()
    if (template.end_date && template.end_date < today) {
      return { skipped: true, reason: '已過結束日期' }
    }

    // 計算下次執行日期
    const nextDate = this.getNextExecutionDate(template as Template)

    // 如果下次執行日期還沒到，跳過
    if (nextDate > today) {
      return { skipped: true, reason: `next execution: ${nextDate}` }
    }

    // 執行模板（複用 execute 方法）
    const result = await this.templatesService.execute(templateId, userId)

    // 更新 last_executed_at
    await supabase
      .from('jj_transaction_templates')
      .update({ last_executed_at: today })
      .eq('id', templateId)
      .eq('user_id', userId)

    return { executed: true, transaction: result }
  }

  /**
   * 執行用戶所有到期的週期模板
   */
  async executeDueRecurrings(userId: string, bookId?: string): Promise<{ executed: number; skipped: number }> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('jj_transaction_templates')
      .select('*')
      .eq('user_id', userId)
      .not('frequency', 'is', null);

    if (bookId) {
      query = query.or(`book_id.eq.${bookId},book_id.is.null`);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw new InternalServerErrorException(`get recurring templates failed: ${error.message}`);
    }

    if (!templates || templates.length === 0) {
      return { executed: 0, skipped: 0 };
    }

    let executed = 0;
    let skipped = 0;

    for (const template of templates) {
      try {
        const result = await this.executeRecurring(template.id, userId);
        if (result.executed) {
          executed++;
        } else {
          skipped++;
        }
      } catch (err) {
        this.logger.error(
          `recurring template ${template.id} failed`,
          err instanceof Error ? err.stack : String(err),
        );
        skipped++;
      }
    }

    return { executed, skipped };
  }
}
