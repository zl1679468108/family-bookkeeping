import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  image_url?: string;
  created_at: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class TransactionService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

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
      throw new Error(`获取交易记录失败: ${error.message}`);
    }

    return data;
  }

  async findOne(id: number): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`获取交易记录失败: ${error.message}`);
    }

    return data;
  }

  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      throw new Error(`创建交易记录失败: ${error.message}`);
    }

    return data;
  }

  async update(
    id: number,
    transaction: Partial<Transaction>,
  ): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新交易记录失败: ${error.message}`);
    }

    return data;
  }

  async remove(id: number): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除交易记录失败: ${error.message}`);
    }
  }
}
