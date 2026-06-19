/**
 * Map API service — 地图相关接口.
 * 对齐 PC 端 frontend/src/services/mapApi.ts
 */
import { apiGet, apiPost } from "./api";
import type {
  MapTransaction,
  MerchantSummary,
  MapFilters,
  MapMember,
  MemberLocation,
  LocationUpdateRequest,
} from "../types";

const MAP_PATH = "/map";

/** 构建查询字符串（Taro 环境无 URLSearchParams） */
function buildQuery(params: Record<string, string | string[] | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join("&");
}

/** 获取地图交易数据（带筛选） */
export const fetchMapTransactions = (
  filters: MapFilters = {},
): Promise<MapTransaction[]> => {
  const query = buildQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type,
    categories: filters.categories,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    memberIds: filters.memberIds,
  });
  return apiGet<MapTransaction[]>(
    `${MAP_PATH}/transactions${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

/** 获取商户汇总 */
export const fetchMerchantSummary = (
  filters: MapFilters = {},
): Promise<MerchantSummary[]> => {
  const query = buildQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type,
    memberIds: filters.memberIds,
  });
  return apiGet<MerchantSummary[]>(
    `${MAP_PATH}/merchants${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

/** 获取某商户的交易列表 */
export const fetchMerchantTransactions = (
  poiId: string | null,
  locationName: string,
  startDate?: string,
  endDate?: string,
): Promise<MapTransaction[]> => {
  const query = buildQuery({
    poi_id: poiId || undefined,
    location_name: locationName,
    startDate,
    endDate,
  });
  return apiGet<MapTransaction[]>(
    `${MAP_PATH}/merchants/transactions${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

/** 获取账本成员列表（用于地图筛选） */
export const fetchBookMembers = (): Promise<MapMember[]> => {
  return apiGet<MapMember[]>(`${MAP_PATH}/members`, { requiresAuth: true });
};

/** 获取成员位置信息 */
export const fetchMemberLocations = (): Promise<MemberLocation[]> => {
  return apiGet<MemberLocation[]>(`${MAP_PATH}/members/locations`, {
    requiresAuth: true,
  });
};

/** 上报我的位置 */
export const updateMyLocation = (
  body: LocationUpdateRequest,
): Promise<void> => {
  return apiPost<void>(`${MAP_PATH}/location`, {
    data: body,
    requiresAuth: true,
  });
};
