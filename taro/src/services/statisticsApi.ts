/**
 * Statistics API service.
 * 对齐 PC 端 frontend/src/services/statisticsApi.ts
 *
 * 小程序仅保留「概览」接口（首页月度收支汇总）。
 * 报表/日历/年对比/成员对比等统计接口随对应页面一并移除。
 */
import { apiGet } from "./api";
import type {
  StatisticsSummary,
  SummaryParams,
} from "../types";

const STATISTICS_PATH = "/statistics";

/** Get statistics summary for a date range */
export const fetchSummary = async (
  params: SummaryParams,
): Promise<StatisticsSummary> => {
  const parts = [
    `startDate=${encodeURIComponent(params.startDate)}`,
    `endDate=${encodeURIComponent(params.endDate)}`,
  ];
  const query = parts.join("&");
  return apiGet<StatisticsSummary>(`${STATISTICS_PATH}/summary?${query}`, { requiresAuth: true });
};
