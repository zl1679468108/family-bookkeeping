/**
 * Statistics API service.
 * 对齐 PC 端 frontend/src/services/statisticsApi.ts
 *
 * 小程序仅保留「概览」接口（首页月度收支汇总）。
 */
import { apiGet } from "./api";
import type {
  StatisticsSummary,
  SummaryParams,
} from "../types";
import { API_PATHS } from "../utils/apiPaths";

/** Get statistics summary for a date range */
export const fetchSummary = async (
  params: SummaryParams,
): Promise<StatisticsSummary> => {
  const parts = [
    `startDate=${encodeURIComponent(params.startDate)}`,
    `endDate=${encodeURIComponent(params.endDate)}`,
  ];
  const query = parts.join("&");
  return apiGet<StatisticsSummary>(API_PATHS.statistics.summary(query), { requiresAuth: true });
};
