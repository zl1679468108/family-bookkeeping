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
  book_id?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  bookId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'amount' | 'date';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class TransactionService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const supabase = this.supabaseService.getClient();

    if (!filters?.userId) {
      throw new ForbiddenException('需要登录才能访问交易记录');
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';
    const offset = (page - 1) * pageSize;

    // 构建查询
    let baseQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', filters.userId);

    if (filters?.bookId) {
      baseQuery = baseQuery.eq('book_id', filters.bookId);
    }

    if (filters?.type) {
      baseQuery = baseQuery.eq('type', filters.type);
    }

    if (filters?.category) {
      baseQuery = baseQuery.eq('category', filters.category);
    }

    if (filters?.startDate) {
      baseQuery = baseQuery.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      baseQuery = baseQuery.lte('date', filters.endDate);
    }

    if (filters?.search) {
      baseQuery = baseQuery.ilike('description', `%${filters.search}%`);
    }

    // 排序 + 分页
    baseQuery = baseQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: false })  // 第二排序字段确保稳定
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await baseQuery;

    if (error) {
      throw new InternalServerErrorException(`获取交易记录失败: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  async findOne(id: number, userId?: string, bookId?: string): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能访问交易记录');
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query.single();

    if (error) {
      throw new InternalServerErrorException(`获取交易记录失败: ${error.message}`);
    }

    if (!data) {
      throw new ForbiddenException('无权访问此交易记录');
    }

    return data;
  }

  async create(transaction: Partial<Transaction>, userId?: string, bookId?: string): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能创建交易记录');
    }

    const transactionData: any = {
      ...transaction,
      user_id: userId,
    };

    // 绑定账本
    if (bookId) {
      transactionData.book_id = bookId;
    }

    // 映射前端驼峰字段到数据库下划线字段
    if (transactionData.locationName !== undefined) {
      transactionData.location_name = transactionData.locationName;
      delete transactionData.locationName;
    }
    if (transactionData.poiId !== undefined) {
      transactionData.poi_id = transactionData.poiId;
      delete transactionData.poiId;
    }

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
    bookId?: string,
  ): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能更新交易记录');
    }

    const existing = await this.findOne(id, userId, bookId);
    if (!existing) {
      throw new ForbiddenException('无权修改此交易记录');
    }

    // 映射前端驼峰字段到数据库下划线字段
    const updateData: any = { ...transaction };
    if ('locationName' in updateData) {
      updateData.location_name = updateData.locationName;
      delete updateData.locationName;
    }
    if ('poiId' in updateData) {
      updateData.poi_id = updateData.poiId;
      delete updateData.poiId;
    }

    let updateQuery = supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);

    if (bookId) {
      updateQuery = updateQuery.eq('book_id', bookId);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      throw new InternalServerErrorException(`更新交易记录失败: ${error.message}`);
    }

    return data;
  }

  async remove(id: number, userId?: string, bookId?: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能删除交易记录');
    }

    const existing = await this.findOne(id, userId, bookId);
    if (!existing) {
      throw new ForbiddenException('无权删除此交易记录');
    }

    let query = supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { error } = await query;

    if (error) {
      throw new InternalServerErrorException(`删除交易记录失败: ${error.message}`);
    }
  }
}
