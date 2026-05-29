// 地图相关类型定义

/** 带位置信息的交易记录 */
export interface MapTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string; // categories.id (UUID)
  amount: number;
  date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  poi_id: string | null;
}

/** 商户消费汇总 */
export interface MerchantSummary {
  poi_id: string | null;
  location_name: string;
  total_amount: number;
  transaction_count: number;
  last_transaction_date: string;
  // 区分收入/支出
  expense_count: number;
  income_count: number;
  expense_total: number;
  income_total: number;
  last_expense_date: string | null;
  last_income_date: string | null;
}

/** 地图筛选条件 */
export interface MapFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
}

/** 位置选择结果 */
export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
  poiId: string | null;
}
