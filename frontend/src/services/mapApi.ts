import { request } from './api';
import type { MapTransaction, MerchantSummary, MapFilters } from '../types/map';

/**
 * 获取带位置信息的交易列表
 */
export const fetchMapTransactions = (filters: MapFilters): Promise<MapTransaction[]> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type) params.append('type', filters.type);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.minAmount != null) params.append('minAmount', String(filters.minAmount));
  if (filters.maxAmount != null) params.append('maxAmount', String(filters.maxAmount));

  return request<MapTransaction[]>(`/map/transactions?${params}`, { requiresAuth: true });
};

/**
 * 获取商户消费汇总
 */
export const fetchMerchantSummary = (filters: MapFilters): Promise<MerchantSummary[]> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type) params.append('type', filters.type);

  return request<MerchantSummary[]>(`/map/merchants?${params}`, { requiresAuth: true });
};
