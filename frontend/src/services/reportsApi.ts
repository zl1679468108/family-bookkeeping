import { request } from './api';

/**
 * 年度报告 API
 * GET /api/reports/annual?year=YYYY
 */
export async function fetchAnnualReport(year: number): Promise<any> {
  const params = new URLSearchParams({ year: String(year) });
  const res = await request<any>(`/reports/annual?${params}`, { requiresAuth: true });
  return res;
}
