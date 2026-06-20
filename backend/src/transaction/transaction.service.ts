import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BatchOperation, BatchTransactionDto } from './dto/batch-transaction.dto';

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  brand?: string;
  image_urls?: string;
  image_url_list?: string[];
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
  /** 查看范围：'own' 只看自己，'all' 查看账本内所有（需是 Owner） */
  view?: 'own' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'amount' | 'date';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  keyword?: string;
  min_amount?: string;
  max_amount?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private supabaseService: SupabaseService) {}

  /** 解析 image_urls 字段（支持 JSON 数组和逗号分隔字符串），并清理 URL 首尾可能存在的反引号/引号 */
  private parseImageUrls(imageUrls: string | null | undefined): string[] {
    if (!imageUrls) return [];
    const clean = (s: any): string => String(s).trim().replace(/^[`'"\s]+|[`'"\s]+$/g, '');
    try {
      const parsed = JSON.parse(imageUrls);
      if (Array.isArray(parsed)) {
        return parsed.map(clean).filter(Boolean);
      }
    } catch {
      if (imageUrls.includes(',')) {
        return imageUrls.split(',').map(clean).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * 检查指定用户是否是指定账本的 Owner
   * @param userId 用户 ID
   * @param bookId 账本 ID
   * @returns 是否是 Owner
   */
  private async isBookOwner(userId: string, bookId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('book_members')
      .select('role')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'owner';
  }

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

    // 检查当前用户是否是账本 Owner（如果指定了 bookId）
    let isOwner = false;
    if (filters?.bookId) {
      isOwner = await this.isBookOwner(filters.userId, filters.bookId);
    }

    // 构建查询条件
    // 如果是 Owner 且 view=all，则查询账本内所有交易；否则只查询自己的交易
    const shouldViewAll = isOwner && filters?.view === 'all';
    
    let baseQuery = supabase
      .from('transactions')
      .select('*');

    if (shouldViewAll) {
      // Owner 查看所有成员的交易
      baseQuery = baseQuery.eq('book_id', filters.bookId);
    } else {
      // 普通视图：只查看自己的交易
      baseQuery = baseQuery.eq('user_id', filters.userId);
      if (filters?.bookId) {
        baseQuery = baseQuery.eq('book_id', filters.bookId);
      }
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

    // 合并 search / keyword 作为模糊搜索词，同时匹配 description 和 brand
    const fuzzyTerm = filters?.keyword || filters?.search;
    if (fuzzyTerm) {
      const likeTerm = `%${fuzzyTerm}%`;
      baseQuery = baseQuery.or(`description.ilike.${likeTerm},brand.ilike.${likeTerm}`);
    }

    if (filters?.min_amount) {
      baseQuery = baseQuery.gte('amount', Number(filters.min_amount));
    }

    if (filters?.max_amount) {
      baseQuery = baseQuery.lte('amount', Number(filters.max_amount));
    }

    if (filters?.date_from) {
      baseQuery = baseQuery.gte('date', filters.date_from);
    }

    if (filters?.date_to) {
      baseQuery = baseQuery.lte('date', filters.date_to);
    }

    // 先用独立的 head 查询获取精确 count（不受 range 影响）
    let countQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (shouldViewAll) {
      countQuery = countQuery.eq('book_id', filters.bookId);
    } else {
      countQuery = countQuery.eq('user_id', filters.userId);
      if (filters?.bookId) countQuery = countQuery.eq('book_id', filters.bookId);
    }

    if (filters?.type) countQuery = countQuery.eq('type', filters.type);
    if (filters?.category) countQuery = countQuery.eq('category', filters.category);
    if (filters?.startDate) countQuery = countQuery.gte('date', filters.startDate);
    if (filters?.endDate) countQuery = countQuery.lte('date', filters.endDate);
    if (fuzzyTerm) {
      const likeTerm = `%${fuzzyTerm}%`;
      countQuery = countQuery.or(`description.ilike.${likeTerm},brand.ilike.${likeTerm}`);
    }
    if (filters?.min_amount) countQuery = countQuery.gte('amount', Number(filters.min_amount));
    if (filters?.max_amount) countQuery = countQuery.lte('amount', Number(filters.max_amount));
    if (filters?.date_from) countQuery = countQuery.gte('date', filters.date_from);
    if (filters?.date_to) countQuery = countQuery.lte('date', filters.date_to);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new InternalServerErrorException(`获取交易记录计数失败: ${countError.message}`);
    }

    // 再查数据（带 range 分页）
    const { data, error } = await baseQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new InternalServerErrorException(`获取交易记录失败: ${error.message}`);
    }

    return {
      data: (data || []).map((t) => this.resolveImageUrl(t)),
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
    
    // 首先查找交易记录（不限制 user_id）
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('id', id);

    const { data, error } = await query.single();

    // 统一返回 404，防止通过响应差异判断记录是否存在
    if (error || !data) {
      throw new NotFoundException('交易记录不存在');
    }

    // 权限检查：
    // 1. 如果 user_id === userId，则有权限
    // 2. 如果当前用户是账本 Owner，则有权限
    if (data.user_id === userId) {
      return this.resolveImageUrl(data);
    }

    // 检查是否是账本 Owner
    if (data.book_id) {
      const isOwner = await this.isBookOwner(userId, data.book_id);
      if (isOwner) {
        return this.resolveImageUrl(data);
      }
    }

    // 无权访问也统一返回 404，避免信息泄露
    throw new NotFoundException('交易记录不存在');
  }

  async create(transaction: Partial<Transaction>, userId?: string, bookId?: string): Promise<Transaction> {
    const supabase = this.supabaseService.getClient();
    
    if (!userId) {
      throw new ForbiddenException('需要登录才能创建交易记录');
    }

    const transactionData: Record<string, unknown> = {
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      date: transaction.date,
      description: transaction.description,
      brand: transaction.brand,
      image_urls: transaction.image_urls,
      image_url_list: transaction.image_url_list,
      location_name: transaction.location_name,
      latitude: transaction.latitude,
      longitude: transaction.longitude,
      poi_id: transaction.poi_id,
      user_id: userId,
    };

    // 绑定账本
    if (bookId) {
      transactionData.book_id = bookId;
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

    // 白名单字段，防止批量赋值
    const updateData: Record<string, unknown> = {};
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.category !== undefined) updateData.category = transaction.category;
    if (transaction.type !== undefined) updateData.type = transaction.type;
    if (transaction.date !== undefined) updateData.date = transaction.date;
    if (transaction.description !== undefined) updateData.description = transaction.description;
    if (transaction.brand !== undefined) updateData.brand = transaction.brand;
    if (transaction.image_urls !== undefined) updateData.image_urls = transaction.image_urls;
    if (transaction.image_url_list !== undefined) updateData.image_url_list = transaction.image_url_list;
    if (transaction.location_name !== undefined) updateData.location_name = transaction.location_name;
    if (transaction.latitude !== undefined) updateData.latitude = transaction.latitude;
    if (transaction.longitude !== undefined) updateData.longitude = transaction.longitude;
    if (transaction.poi_id !== undefined) updateData.poi_id = transaction.poi_id;

    // 检查是否是 Owner
    const isOwner = bookId ? await this.isBookOwner(userId, bookId) : false;

    let updateQuery = supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    // 如果是 Owner，则限制 book_id；否则限制 user_id
    if (isOwner && bookId) {
      updateQuery = updateQuery.eq('book_id', bookId);
    } else {
      updateQuery = updateQuery.eq('user_id', userId);
      if (bookId) {
        updateQuery = updateQuery.eq('book_id', bookId);
      }
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

    // 检查是否是 Owner
    const isOwner = bookId ? await this.isBookOwner(userId, bookId) : false;

    let query = supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    // 如果是 Owner，则限制 book_id；否则限制 user_id
    if (isOwner && bookId) {
      query = query.eq('book_id', bookId);
    } else {
      query = query.eq('user_id', userId);
      if (bookId) {
        query = query.eq('book_id', bookId);
      }
    }

    const { error } = await query;

    if (error) {
      throw new InternalServerErrorException(`删除交易记录失败: ${error.message}`);
    }
  }

  /**
   * 批量操作交易记录：支持批量更新分类/类型/日期、移动账本、删除
   * 所有操作在单条 SQL 中完成，不使用 JavaScript 循环逐条更新
   */
  async batch(
    userId: string,
    bookId: string | undefined,
    dto: BatchTransactionDto,
  ): Promise<{ affected: number }> {
    const supabase = this.supabaseService.getClient();

    // 检查是否是 Owner
    const isOwner = bookId ? await this.isBookOwner(userId, bookId) : false;

    // 1. 归属校验：确认所有 ids 属于当前用户（和指定账本）
    // 如果是 Owner，则只检查 book_id；否则检查 user_id
    let countQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (isOwner && bookId) {
      // Owner：检查 book_id
      countQuery = countQuery.eq('book_id', bookId);
    } else {
      // 普通用户：检查 user_id
      countQuery = countQuery.eq('user_id', userId);
      if (bookId) {
        countQuery = countQuery.eq('book_id', bookId);
      }
    }

    countQuery = countQuery.in('id', dto.ids);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new InternalServerErrorException(
        `批量操作校验失败: ${countError.message}`,
      );
    }

    if (count !== dto.ids.length) {
      throw new ForbiddenException('部分交易不存在或不属于当前账本');
    }

    // 2. 执行批量操作（单条 SQL）
    const { operation, payload } = dto;

    // 防御性校验（控制器层已通过 class-validator 校验，此处为二次保障）
    if (operation !== BatchOperation.DELETE && !payload) {
      throw new InternalServerErrorException(
        `操作 ${operation} 缺少必需的 payload`,
      );
    }

    // 构建更新 / 删除查询
    let execQuery: any;

    if (operation === BatchOperation.DELETE) {
      execQuery = supabase.from('transactions').delete();
    } else {
      const updateData: Record<string, any> = {};

      switch (operation) {
        case BatchOperation.UPDATE_CATEGORY:
          // 数据库列名为 category（与现有代码保持一致）
          updateData.category = payload!.category_id;
          break;
        case BatchOperation.UPDATE_TYPE:
          updateData.type = payload!.type;
          break;
        case BatchOperation.UPDATE_DATE:
          updateData.date = payload!.date;
          break;
        case BatchOperation.MOVE_BOOK:
          updateData.book_id = payload!.book_id;
          break;
      }

      execQuery = supabase.from('transactions').update(updateData);
    }

    // 链式过滤
    if (isOwner && bookId) {
      // Owner：只限制 book_id
      execQuery = execQuery.eq('book_id', bookId).in('id', dto.ids);
    } else {
      // 普通用户：限制 user_id + (可选) book_id
      execQuery = execQuery.eq('user_id', userId).in('id', dto.ids);
      if (bookId) {
        execQuery = execQuery.eq('book_id', bookId);
      }
    }

    const { error } = await execQuery;

    if (error) {
      throw new InternalServerErrorException(`批量操作失败: ${error.message}`);
    }

    return { affected: dto.ids.length };
  }

  /**
   * 上传收据图片
   * @param id 交易记录 ID
   * @param userId 当前用户 ID
   * @param file 上传的图片文件
   * @returns 收据的公开访问 URL
   */
  async uploadReceipt(
    id: number,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ image_url: string }> {
    const transaction = await this.findOne(id, userId);

    // 生成路径: receipts/{userId}/{year}/{month}/{uuid}.{ext}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `receipts/${userId}/${year}/${month}/${filename}`;

    const supabase = this.supabaseService.getClient();

    // 上传到 Supabase Storage
    const { error } = await supabase.storage.from('receipts').upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000',
    });

    if (error) {
      throw new InternalServerErrorException('收据上传失败: ' + error.message);
    }

    // 获取 public URL
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // 更新数据库 image_urls 字段：追加新图到数组（存储相对路径）
    const existingPaths = this.parseImageUrls(transaction.image_urls);
    const mergedPaths = [...existingPaths, path];

    const { error: updateErr } = await supabase
      .from('transactions')
      .update({ image_urls: JSON.stringify(mergedPaths) })
      .eq('id', id);

    if (updateErr) {
      throw new InternalServerErrorException('更新交易记录失败: ' + updateErr.message);
    }

    return { image_url: publicUrl };
  }

  /**
   * 删除收据图片
   * @param id 交易记录 ID
   * @param userId 当前用户 ID
   */
  async deleteReceipt(id: number, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);

    const existingPaths = this.parseImageUrls(transaction.image_urls);

    if (existingPaths.length === 0) {
      throw new NotFoundException('该交易记录没有收据');
    }

    const supabase = this.supabaseService.getClient();

    // 删除存储文件
    const { error: removeErr } = await supabase.storage
      .from('receipts')
      .remove(existingPaths);

    if (removeErr) {
      // 文件可能已被删除，日志记录但不阻断流程
      this.logger.warn(`删除收据存储文件失败: ${removeErr.message}`);
    }

    // 清空 image_urls 字段
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({ image_urls: null })
      .eq('id', id);

    if (updateErr) {
      throw new InternalServerErrorException('更新交易记录失败: ' + updateErr.message);
    }
  }

  /**
   * 将相对路径的 image_urls 转换为完整的 Supabase Storage 公开 URL
   */
  private resolveImageUrl(transaction: any): any {
    const supabase = this.supabaseService.getClient();
    const resolveOne = (url: string): string => {
      if (!url || url.startsWith('http')) return url;
      const { data } = supabase.storage.from('receipts').getPublicUrl(url);
      return data?.publicUrl || url;
    };

    const paths = this.parseImageUrls(transaction?.image_urls);
    const resolved = paths.map(resolveOne).filter(Boolean);

    return {
      ...transaction,
      image_urls: resolved.length > 0 ? JSON.stringify(resolved) : undefined,
      image_url_list: resolved,
    };
  }
}
