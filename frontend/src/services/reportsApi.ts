import { request } from './api';

/**
 * 年度报告 API
 * GET /api/reports/annual?year=YYYY&book_id=xxx
 */
export async function fetchAnnualReport(year: number, bookId?: string): Promise<any> {
  const params = new URLSearchParams({ year: String(year) });
  if (bookId) params.set('book_id', bookId);
  const res = await request<any>(`/reports/annual?${params}`, { requiresAuth: true });
  return res;
}
