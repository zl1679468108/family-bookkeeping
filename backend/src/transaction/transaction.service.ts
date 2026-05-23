import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
  user_id?: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
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

    if (!filters?.userId) {
      throw new ForbiddenException('需要登录才能访问交易记录');
    }
    
    query = query.eq('user_id', filters.userId);

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
      throw new InternalServerErrorException(`获取交易记录失败: ${error.message}`);
    }

    return data;
  }

  async findOne(id: number, userId?: string): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能访问交易记录');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new InternalServerErrorException(`获取交易记录失败: ${error.message}`);
    }

    if (!data) {
      throw new ForbiddenException('无权访问此交易记录');
    }

    return data;
  }

  async create(transaction: Partial<Transaction>, userId?: string): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能创建交易记录');
    }

    const transactionData = {
      ...transaction,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`创建交易记录失败: ${error.message}`);
    }

    return data;
  }

  async update(
    id: number,
    transaction: Partial<Transaction>,
    userId?: string,
  ): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能更新交易记录');
    }

    const existing = await this.findOne(id, userId);
    if (!existing) {
      throw new ForbiddenException('无权修改此交易记录');
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`更新交易记录失败: ${error.message}`);
    }

    return data;
  }

  async remove(id: number, userId?: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能删除交易记录');
    }

    const existing = await this.findOne(id, userId);
    if (!existing) {
      throw new ForbiddenException('无权删除此交易记录');
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(`删除交易记录失败: ${error.message}`);
    }
  }
}
