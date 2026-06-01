import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

/** Shape of a row in the transaction_templates table. */
export interface Template {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  amount: number | null;
  category_id: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  poi_id: string | null;
  merchant_name: string | null;
  book_id: string | null;
  sort_order: number;
  created_at: string;
}

@Injectable()
export class TemplatesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * GET /templates — 获取当前用户的模板列表，按 sort_order 升序排列。
   * 如果传入了 bookId，则同时返回该账本的模板和未绑定账本的通用模板。
   */
  async findAll(userId: string, bookId?: string): Promise<Template[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('transaction_templates')
      .select('*')
      .eq('user_id', userId);

    if (bookId) {
      // 返回指定账本的模板 或 未绑定账本的通用模板
      query = query.or(`book_id.eq.${bookId},book_id.is.null`);
    }

    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `获取模板列表失败: ${error.message}`,
      );
    }

    return (data ?? []) as Template[];
  }

  /**
   * POST /templates — 创建新模板。
   */
  async create(
    userId: string,
    bookId: string | undefined,
    dto: CreateTemplateDto,
  ): Promise<Template> {
    const supabase = this.supabaseService.getClient();

    const insertData: Record<string, any> = {
      user_id: userId,
      name: dto.name,
      type: dto.type,
    };

    if (dto.amount !== undefined) insertData.amount = dto.amount;
    if (dto.category_id !== undefined) insertData.category_id = dto.category_id;
    if (dto.note !== undefined) insertData.note = dto.note;
    if (dto.latitude !== undefined) insertData.latitude = dto.latitude;
    if (dto.longitude !== undefined) insertData.longitude = dto.longitude;
    if (dto.location_name !== undefined) insertData.location_name = dto.location_name;
    if (dto.poi_id !== undefined) insertData.poi_id = dto.poi_id;
    if (dto.merchant_name !== undefined) insertData.merchant_name = dto.merchant_name;
    if (dto.sort_order !== undefined) insertData.sort_order = dto.sort_order;

    // book_id 优先使用 dto 中的值，否则使用请求头传来的 bookId
    insertData.book_id = dto.book_id ?? bookId ?? null;

    const { data, error } = await supabase
      .from('transaction_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `创建模板失败: ${error.message}`,
      );
    }

    return data as Template;
  }

  /**
   * PUT /templates/:id — 编辑模板（校验归属）。
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    const supabase = this.supabaseService.getClient();

    // 校验归属
    const existing = await this.findOwned(id, userId);

    const updateData: Record<string, any> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.category_id !== undefined) updateData.category_id = dto.category_id;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.location_name !== undefined) updateData.location_name = dto.location_name;
    if (dto.poi_id !== undefined) updateData.poi_id = dto.poi_id;
    if (dto.merchant_name !== undefined) updateData.merchant_name = dto.merchant_name;
    if (dto.book_id !== undefined) updateData.book_id = dto.book_id;
    if (dto.sort_order !== undefined) updateData.sort_order = dto.sort_order;

    const { data, error } = await supabase
      .from('transaction_templates')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `更新模板失败: ${error.message}`,
      );
    }

    return data as Template;
  }

  /**
   * DELETE /templates/:id — 删除模板（校验归属）。
   */
  async remove(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 校验归属
    await this.findOwned(id, userId);

    const { error } = await supabase
      .from('transaction_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(
        `删除模板失败: ${error.message}`,
      );
    }
  }

  /**
   * POST /templates/:id/execute — 执行模板，插入一条 transaction 记录。
   *
   * @param id      模板 ID
   * @param userId  当前用户 ID
   * @param amount  可选，传入金额覆盖模板默认值
   */
  async execute(
    id: string,
    userId: string,
    amount?: number,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // 1. 读取模板
    const template = await this.findOwned(id, userId);

    // 2. 用模板字段构建 transaction 数据
    const transactionData: Record<string, any> = {
      type: template.type,
      user_id: userId,
      date: new Date().toISOString().slice(0, 10), // 当天日期
    };

    // amount：传参覆盖模板默认值
    const finalAmount = amount ?? template.amount;
    if (finalAmount !== null && finalAmount !== undefined) {
      transactionData.amount = finalAmount;
    }

    // 字段映射: category_id → category, note → description
    if (template.category_id) {
      transactionData.category = template.category_id;
    }
    if (template.note) {
      transactionData.description = template.note;
    }
    if (template.book_id) {
      transactionData.book_id = template.book_id;
    }
    if (template.latitude !== null && template.latitude !== undefined) {
      transactionData.latitude = template.latitude;
    }
    if (template.longitude !== null && template.longitude !== undefined) {
      transactionData.longitude = template.longitude;
    }
    if (template.location_name) {
      transactionData.location_name = template.location_name;
    }

    // 3. 插入 transactions 表
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `执行模板失败: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * PUT /templates/reorder — 批量重排模板顺序。
   * 将 ids 数组中的模板依次设置 sort_order 为数组索引值。
   */
  async reorder(userId: string, ids: string[]): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 遍历 ids，逐个更新 sort_order
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase
        .from('transaction_templates')
        .update({ sort_order: i })
        .eq('id', ids[i])
        .eq('user_id', userId);

      if (error) {
        throw new InternalServerErrorException(
          `重排模板失败: ${error.message}`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * 查询指定 ID 的模板并校验归属。不存在或不属于当前用户则抛异常。
   */
  private async findOwned(id: string, userId: string): Promise<Template> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('transaction_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('模板不存在或无权访问');
    }

    return data as Template;
  }
}
