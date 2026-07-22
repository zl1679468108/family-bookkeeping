import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WechatService } from '../wechat/wechat.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ExecuteTemplateDto } from './dto/execute-template.dto';
import { getBeijingDate } from '../common/utils/time.util';

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
  frequency?: string;
  start_date?: string;
  end_date?: string;
  last_executed_at?: string;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly wechatService: WechatService,
  ) {}

  async findAll(userId: string, bookId?: string): Promise<Template[]> {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('jj_transaction_templates').select('*').eq('user_id', userId);
    if (bookId) query = query.or(`book_id.eq.${bookId},book_id.is.null`);
    query = query.order('sort_order', { ascending: true });
    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(`get templates failed: ${error.message}`);
    return (data ?? []) as Template[];
  }

  async create(userId: string, bookId: string | undefined, dto: CreateTemplateDto): Promise<Template> {
    await this.wechatService.checkText(dto.name, 1);
    if (dto.note !== undefined) await this.wechatService.checkText(dto.note, 2);
    if (dto.location_name !== undefined) await this.wechatService.checkText(dto.location_name, 2);
    if (dto.merchant_name !== undefined) await this.wechatService.checkText(dto.merchant_name, 2);

    const supabase = this.supabaseService.getClient();
    const insertData: Record<string, any> = { user_id: userId, name: dto.name, type: dto.type };
    if (dto.amount !== undefined) insertData.amount = dto.amount;
    if (dto.category_id !== undefined) insertData.category_id = dto.category_id;
    if (dto.note !== undefined) insertData.note = dto.note;
    if (dto.latitude !== undefined) insertData.latitude = dto.latitude;
    if (dto.longitude !== undefined) insertData.longitude = dto.longitude;
    if (dto.location_name !== undefined) insertData.location_name = dto.location_name;
    if (dto.poi_id !== undefined) insertData.poi_id = dto.poi_id;
    if (dto.merchant_name !== undefined) insertData.merchant_name = dto.merchant_name;
    if (dto.sort_order !== undefined) insertData.sort_order = dto.sort_order;
    insertData.book_id = dto.book_id ?? bookId ?? null;
    if (dto.frequency !== undefined) insertData.frequency = dto.frequency;
    if (dto.start_date !== undefined) insertData.start_date = dto.start_date;
    if (dto.end_date !== undefined) insertData.end_date = dto.end_date;

    const { data, error } = await supabase.from('jj_transaction_templates').insert(insertData).select().single();
    if (error) throw new InternalServerErrorException(`create template failed: ${error.message}`);
    return data as Template;
  }

  async update(id: string, userId: string, dto: UpdateTemplateDto): Promise<Template> {
    if (dto.name !== undefined) await this.wechatService.checkText(dto.name, 1);
    if (dto.note !== undefined) await this.wechatService.checkText(dto.note, 2);
    if (dto.location_name !== undefined) await this.wechatService.checkText(dto.location_name, 2);
    if (dto.merchant_name !== undefined) await this.wechatService.checkText(dto.merchant_name, 2);

    const supabase = this.supabaseService.getClient();
    await this.findOwned(id, userId);
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
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.start_date !== undefined) updateData.start_date = dto.start_date;
    if (dto.end_date !== undefined) updateData.end_date = dto.end_date;

    const { data, error } = await supabase.from('jj_transaction_templates').update(updateData).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw new InternalServerErrorException(`update template failed: ${error.message}`);
    return data as Template;
  }

  async remove(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    await this.findOwned(id, userId);
    const { error } = await supabase.from('jj_transaction_templates').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new InternalServerErrorException(`delete template failed: ${error.message}`);
  }

  async execute(id: string, userId: string, amount?: number): Promise<any> {
    const supabase = this.supabaseService.getClient();
    const template = await this.findOwned(id, userId);
    const transactionData: Record<string, any> = {
      type: template.type, user_id: userId, date: getBeijingDate(),
    };
    const finalAmount = amount ?? template.amount;
    if (finalAmount !== null && finalAmount !== undefined) transactionData.amount = finalAmount;
    if (template.category_id) transactionData.category = template.category_id;
    if (template.note) transactionData.description = template.note;
    if (template.book_id) transactionData.book_id = template.book_id;
    if (template.latitude !== null && template.latitude !== undefined) transactionData.latitude = template.latitude;
    if (template.longitude !== null && template.longitude !== undefined) transactionData.longitude = template.longitude;
    if (template.location_name) transactionData.location_name = template.location_name;

    const { data, error } = await supabase.from('jj_transactions').insert(transactionData).select().single();
    if (error) throw new InternalServerErrorException(`execute template failed: ${error.message}`);
    return data;
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const updates = ids.map((id, i) => supabase.from('jj_transaction_templates').update({ sort_order: i }).eq('id', id).eq('user_id', userId));
    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) throw new InternalServerErrorException(`reorder failed: ${errors[0].error?.message}`);
  }

  private async findOwned(id: string, userId: string): Promise<Template> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('jj_transaction_templates').select('*').eq('id', id).eq('user_id', userId).single();
    if (error || !data) throw new NotFoundException('template not found');
    return data as Template;
  }
}
