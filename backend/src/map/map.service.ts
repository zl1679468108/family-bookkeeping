import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MapTransactionsQueryDto, MerchantQueryDto } from './dto/map-query.dto';

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
}

export interface MerchantSummary {
  poi_id: string | null;
  location_name: string;
  total_amount: number;
  transaction_count: number;
  last_transaction_date: string;
}

@Injectable()
export class MapService {
  constructor(private supabaseService: SupabaseService) {}

  async getTransactionsWithLocation(
    userId: string,
    bookId: string | undefined,
    query: MapTransactionsQueryDto,
  ): Promise<MapTransaction[]> {
    const supabase = this.supabaseService.getClient();

    let dbQuery = supabase
      .from('transactions')
      .select('id, type, category, amount, date, description, latitude, longitude, location_name, poi_id')
      .eq('user_id', userId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

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

    return (data || []) as unknown as MapTransaction[];
  }

  async getMerchantSummary(
    userId: string,
    bookId: string | undefined,
    query: MerchantQueryDto,
  ): Promise<MerchantSummary[]> {
    const supabase = this.supabaseService.getClient();

    // 获取所有带位置信息的交易，在应用层聚合
    const transactions = await this.getTransactionsWithLocation(userId, bookId, {
      ...query,
    } as MapTransactionsQueryDto);

    // 按 poi_id + location_name 聚合
    const merchantMap = new Map<string, MerchantSummary>();

    for (const tx of transactions) {
      const key = tx.poi_id || tx.location_name;
      const existing = merchantMap.get(key);

      if (existing) {
        existing.total_amount += Number(tx.amount);
        existing.transaction_count += 1;
        if (tx.date > existing.last_transaction_date) {
          existing.last_transaction_date = tx.date;
        }
      } else {
        merchantMap.set(key, {
          poi_id: tx.poi_id,
          location_name: tx.location_name,
          total_amount: Number(tx.amount),
          transaction_count: 1,
          last_transaction_date: tx.date,
        });
      }
    }

    return Array.from(merchantMap.values()).sort(
      (a, b) => b.total_amount - a.total_amount,
    );
  }
}
