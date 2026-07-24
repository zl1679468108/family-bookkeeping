import { request } from './api';
import { API_PATHS } from '../utils/apiPaths';

/**
 * 年度报告 API
 * GET /api/reports/annual?year=YYYY
 */
export async function fetchAnnualReport(year: number): Promise<any> {
  const params = new URLSearchParams({ year: String(year) });
  const res = await request<any>(API_PATHS.reports.annual(params.toString()), { requiresAuth: true });
  return res;
}
