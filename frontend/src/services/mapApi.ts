import { request } from './api';
import type {
  MapTransaction,
  MerchantSummary,
  MapFilters,
  MapMember,
  MemberLocation,
  LocationUpdateRequest,
} from '../types/map';

/**
 * 获取带位置信息的交易列表（P1 扩展：支持 memberIds 多成员筛选）
 */
export const fetchMapTransactions = (filters: MapFilters): Promise<MapTransaction[]> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type) params.append('type', filters.type);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.minAmount != null) params.append('minAmount', String(filters.minAmount));
  if (filters.maxAmount != null) params.append('maxAmount', String(filters.maxAmount));
  if (filters.memberIds?.length) params.append('memberIds', filters.memberIds.join(','));

  return request<MapTransaction[]>(`/map/transactions?${params}`, { requiresAuth: true });
};

/**
 * 获取商户消费汇总（P1 扩展：支持 memberIds 多成员筛选）
 */
export const fetchMerchantSummary = (filters: MapFilters): Promise<MerchantSummary[]> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type) params.append('type', filters.type);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.memberIds?.length) params.append('memberIds', filters.memberIds.join(','));

  return request<MerchantSummary[]>(`/map/merchants?${params}`, { requiresAuth: true });
};

/**
 * 获取商户交易记录历史
 */
export const fetchMerchantTransactions = (
  poiId: string | null,
  locationName: string,
  startDate?: string,
  endDate?: string,
): Promise<MapTransaction[]> => {
  const params = new URLSearchParams();
  if (poiId) {
    params.append('poi_id', poiId);
  } else {
    params.append('location_name', locationName);
  }
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return request<MapTransaction[]>(`/map/merchants/transactions?${params}`, { requiresAuth: true });
};

// ===== P1 新增 API =====

/**
 * 获取账本成员列表（含颜色分配）
 * GET /map/members → { data: MapMember[] }
 */
export const fetchBookMembers = (): Promise<MapMember[]> => {
  return request<MapMember[]>('/map/members', { requiresAuth: true });
};

/**
 * 获取正在共享位置的成员信息
 * GET /map/members/locations → { data: MemberLocation[] }
 */
export const fetchMemberLocations = (): Promise<MemberLocation[]> => {
  return request<MemberLocation[]>('/map/members/locations', { requiresAuth: true });
};

/**
 * 上报/更新当前用户位置
 * POST /map/location body: LocationUpdateRequest
 */
export const updateMyLocation = (body: LocationUpdateRequest): Promise<void> => {
  return request<void>('/map/location', {
    method: 'POST',
    requiresAuth: true,
    body,
  });
};
