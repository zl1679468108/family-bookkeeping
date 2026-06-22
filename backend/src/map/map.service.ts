import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MapTransactionsQueryDto, MerchantQueryDto, MerchantTransactionsQueryDto } from './dto/map-query.dto';
import { UpdateLocationDto } from './dto/location.dto';

/** 地图交易记录（P1 扩展：新增 user_id） */
export interface MapTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  poi_id: string | null;
  user_id?: string; // P1 新增：交易所属用户 ID
  userId?: string;  // P1 新增：camelCase 映射，前端友好
}

/** P1 新增：成员实时位置 */
export interface MemberLocation {
  userId: string;
  username: string;
  email: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

/** P1 新增：成员消费明细（member_breakdown 子项） */
export interface MemberBreakdownItem {
  userId: string;
  username: string;
  expenseTotal: number;
  expenseCount: number;
}

/** 商户消费汇总（P1 扩展：新增 member_breakdown） */
export interface MerchantSummary {
  poi_id: string | null;
  location_name: string;
  total_amount: number;
  transaction_count: number;
  last_transaction_date: string;
  expense_count: number;
  income_count: number;
  expense_total: number;
  income_total: number;
  last_expense_date: string | null;
  last_income_date: string | null;
  memberBreakdown?: MemberBreakdownItem[]; // P1 新增：成员消费分布
  latitude?: number; // P2 新增：商户定位坐标
  longitude?: number;
}

/** P1 新增：账本成员（含颜色分配） */
export interface MapMember {
  userId: string;
  username: string;
  role: string;
  color: string;
}

/** 成员固定颜色池，按 joined_at 索引顺序分配 */
const MEMBER_COLORS: readonly string[] = [
  '#E74C3C', // 红
  '#E67E22', // 橙
  '#F1C40F', // 黄
  '#2ECC71', // 绿
  '#1ABC9C', // 青
  '#3498DB', // 蓝
  '#9B59B6', // 紫
  '#E91E63', // 粉
  '#795548', // 棕
  '#607D8B', // 灰蓝
];

@Injectable()
export class MapService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * 获取带位置信息的交易记录。
   * P1 扩展：当 memberIds 有值时，查询多个用户的交易（.in 替代 .eq），
   * 并在响应中包含 user_id 字段。
   */
  async getTransactionsWithLocation(
    userId: string,
    bookId: string | undefined,
    query: MapTransactionsQueryDto,
    memberIds?: string[],
  ): Promise<MapTransaction[]> {
    const supabase = this.supabaseService.getClient();

    const baseFields = 'id, type, category, amount, date, description, latitude, longitude, location_name, poi_id';
    // P1: multi-member mode — also select user_id
    const selectFields = (memberIds && memberIds.length > 0)
      ? `${baseFields}, user_id`
      : baseFields;

    let dbQuery = supabase
      .from('jj_transactions')
      .select(selectFields)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // P1: multi-member query → .in('user_id', memberIds)
    // P0 fallback: single-user → .eq('user_id', userId)
    if (memberIds && memberIds.length > 0) {
      dbQuery = dbQuery.in('user_id', memberIds);
    } else {
      dbQuery = dbQuery.eq('user_id', userId);
    }

    if (bookId) {
      dbQuery = dbQuery.eq('book_id', bookId);
    }

    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    if (query.categories) {
      const categoryList = query.categories.split(',').map((c) => c.trim()).filter(Boolean);
      if (categoryList.length > 0) {
        dbQuery = dbQuery.in('category', categoryList);
      }
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('date', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('date', query.endDate);
    }

    if (query.minAmount != null) {
      dbQuery = dbQuery.gte('amount', query.minAmount);
    }

    if (query.maxAmount != null) {
      dbQuery = dbQuery.lte('amount', query.maxAmount);
    }

    dbQuery = dbQuery.order('date', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException(`获取地图交易数据失败: ${error.message}`);
    }

    return ((data || []) as any[]).map((tx: any) => ({
      ...tx,
      userId: tx.user_id,
    })) as unknown as MapTransaction[];
  }

  /**
   * 获取商户消费汇总（按 poi_id + location_name 聚合）。
   * P1 扩展：当 memberIds 有值时，额外计算 member_breakdown 字段，
   * 包含每个商户下各成员的支出总计和笔数。
   */
  async getMerchantSummary(
    userId: string,
    bookId: string | undefined,
    query: MerchantQueryDto,
    memberIds?: string[],
  ): Promise<MerchantSummary[]> {
    const supabase = this.supabaseService.getClient();

    // 复用 getTransactionsWithLocation 获取原始数据
    const transactions = await this.getTransactionsWithLocation(userId, bookId, {
      ...query,
    } as MapTransactionsQueryDto, memberIds);

    const isMultiMember = memberIds && memberIds.length > 0;

    // 按 poi_id + location_name 聚合
    const merchantMap = new Map<string, MerchantSummary>();
    // P1: 按商户 → 按 user_id 分组的支出明细
    const breakdownMap = new Map<string, Map<string, { expense_total: number; expense_count: number }>>();

    for (const tx of transactions) {
      const key = tx.poi_id || tx.location_name;
      const amount = Number(tx.amount);
      const isIncome = tx.type === 'income';

      const existing = merchantMap.get(key);
      if (existing) {
        existing.total_amount += amount;
        existing.transaction_count += 1;
        if (tx.date > existing.last_transaction_date) {
          existing.last_transaction_date = tx.date;
        }
        if (isIncome) {
          existing.income_count += 1;
          existing.income_total += amount;
          if (!existing.last_income_date || tx.date > existing.last_income_date) {
            existing.last_income_date = tx.date;
          }
        } else {
          existing.expense_count += 1;
          existing.expense_total += amount;
          if (!existing.last_expense_date || tx.date > existing.last_expense_date) {
            existing.last_expense_date = tx.date;
          }
        }
      } else {
        merchantMap.set(key, {
          poi_id: tx.poi_id,
          location_name: tx.location_name,
          total_amount: amount,
          transaction_count: 1,
          last_transaction_date: tx.date,
          expense_count: isIncome ? 0 : 1,
          income_count: isIncome ? 1 : 0,
          expense_total: isIncome ? 0 : amount,
          income_total: isIncome ? amount : 0,
          last_expense_date: isIncome ? null : tx.date,
          last_income_date: isIncome ? tx.date : null,
          // P2: 记录商户所在的经纬度，用于前端定位
          latitude: tx.latitude,
          longitude: tx.longitude,
        });
      }

      // P1: 多成员模式下，按 user_id 追踪支出（仅支出类型）
      if (isMultiMember && tx.user_id && !isIncome) {
        if (!breakdownMap.has(key)) {
          breakdownMap.set(key, new Map());
        }
        const memberMap = breakdownMap.get(key)!;
        const memberEntry = memberMap.get(tx.user_id);
        if (memberEntry) {
          memberEntry.expense_total += amount;
          memberEntry.expense_count += 1;
        } else {
          memberMap.set(tx.user_id, { expense_total: amount, expense_count: 1 });
        }
      }
    }

    // P1: 批量查询 users 表获取 username 映射，组装 member_breakdown
    if (isMultiMember && breakdownMap.size > 0) {
      const allUserIds = new Set<string>();
      for (const memberMap of breakdownMap.values()) {
        for (const uid of memberMap.keys()) {
          allUserIds.add(uid);
        }
      }

      const userIdList = Array.from(allUserIds);
      const { data: usersData, error: usersError } = await supabase
        .from('jj_users')
        .select('id, username')
        .in('id', userIdList);

      const usernameMap = new Map<string, string>();
      if (!usersError && usersData) {
        for (const u of usersData) {
          usernameMap.set(u.id, (u as any).username || '未知用户');
        }
      } else {
        // 查询失败时使用默认值，不阻塞主流程
        for (const uid of userIdList) {
          usernameMap.set(uid, '未知用户');
        }
      }

      // 为每个商户填充 memberBreakdown
      for (const [merchantKey, memberMap] of breakdownMap) {
        const merchant = merchantMap.get(merchantKey);
        if (merchant) {
          merchant.memberBreakdown = [];
          for (const [uid, breakdown] of memberMap) {
            merchant.memberBreakdown.push({
              userId: uid,
              username: usernameMap.get(uid) || '未知用户',
              expenseTotal: breakdown.expense_total,
              expenseCount: breakdown.expense_count,
            });
          }
        }
      }
    }

    return Array.from(merchantMap.values()).sort(
      (a, b) => b.total_amount - a.total_amount,
    );
  }

  /**
   * 获取单个商户的交易列表。
   * P1 不需要大改，保持兼容即可。
   */
  async getMerchantTransactions(
    userId: string,
    bookId: string | undefined,
    query: MerchantTransactionsQueryDto,
  ): Promise<MapTransaction[]> {
    const supabase = this.supabaseService.getClient();

    let dbQuery = supabase
      .from('jj_transactions')
      .select('id, type, category, amount, date, description, latitude, longitude, location_name, poi_id')
      .eq('user_id', userId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (bookId) {
      dbQuery = dbQuery.eq('book_id', bookId);
    }

    // 按 poi_id 或 location_name 筛选
    if (query.poi_id) {
      dbQuery = dbQuery.eq('poi_id', query.poi_id);
    } else if (query.location_name) {
      dbQuery = dbQuery.eq('location_name', query.location_name);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('date', query.startDate);
    }
    if (query.endDate) {
      dbQuery = dbQuery.lte('date', query.endDate);
    }

    dbQuery = dbQuery.order('date', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException(`获取商户交易记录失败: ${error.message}`);
    }

    return (data || []) as unknown as MapTransaction[];
  }

  /**
   * P1 新增：获取账本成员列表（含固定颜色分配）。
   * 查询 book_members JOIN users，按 joined_at 排序，
   * 使用固定颜色池按索引分配颜色。
   */
  async getBookMembers(bookId: string): Promise<MapMember[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('jj_book_members')
      .select('user_id, role, joined_at, jj_users(id, username)')
      .eq('book_id', bookId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(`获取账本成员失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((bm: any, index: number) => ({
      userId: bm.user_id,
      username: bm.users?.username || '未知用户',
      role: bm.role,
      color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    }));
  }

  // ====== P1-1 位置共享 ======

  async upsertMemberLocation(userId: string, bookId: string | undefined, dto: UpdateLocationDto) {
    if (!bookId) return null;
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('jj_member_locations')
      .upsert({
        book_id: bookId,
        user_id: userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_sharing: dto.isSharing,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'book_id,user_id' })
      .select()
      .single();
    if (error) {
      Logger.error(`upsertMemberLocation failed: ${error.message}`, 'MapService');
      throw new InternalServerErrorException(`位置上报失败: ${error.message}`);
    }
    return data;
  }

  async getSharingMemberLocations(bookId: string | undefined): Promise<MemberLocation[]> {
    if (!bookId) return [];
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('jj_member_locations')
      .select('user_id, latitude, longitude, updated_at, is_sharing, jj_users!inner(username, email)')
      .eq('book_id', bookId)
      .eq('is_sharing', true);
    if (error) {
      Logger.error(`getSharingMemberLocations failed: ${error.message}`, 'MapService');
      return [];
    }
    return (data || []).map((r: any) => ({
      userId: r.user_id,
      username: r.users?.username || '未知用户',
      email: r.users?.email || '',
      latitude: r.latitude,
      longitude: r.longitude,
      updatedAt: r.updated_at,
    }));
  }
}
