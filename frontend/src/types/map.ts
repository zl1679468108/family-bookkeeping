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
  // P1 新增：多成员场景
  userId?: string;
  username?: string;
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
  // P1 新增：成员消费分布
  memberBreakdown?: MemberBreakdown[];
  // P2 新增：地图定位所需的经纬度
  latitude?: number;
  longitude?: number;
}

/** 地图筛选条件 */
export interface MapFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  // P1 新增：按成员筛选
  memberIds?: string[];
}

/** 位置选择结果 */
export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
  poiId: string | null;
}

// ===== P1 新增类型 =====

/** 成员位置信息 */
export interface MemberLocation {
  userId: string;
  username: string;
  email: string;
  latitude: number;
  longitude: number;
  updatedAt: string; // ISO 8601，用于判断离线
}

/** 成员信息（含颜色分配） */
export interface MapMember {
  userId: string;
  username: string;
  role: 'owner' | 'member';
  color: string;
}

/** 成员消费明细（member_breakdown 子项） */
export interface MemberBreakdown {
  userId: string;
  username: string;
  expenseTotal: number;
  expenseCount: number;
}

/** 位置上报请求体 */
export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  isSharing: boolean;
}
