import { useQuery } from '@tanstack/react-query';
import { fetchAnnualReport } from '../services/reportsApi';

/**
 * 年度报告数据 Hook
 */
export function useAnnualReport(year: number, bookId?: string) {
  return useQuery({
    queryKey: ['annual-report', year, bookId],
    queryFn: () => fetchAnnualReport(year, bookId),
    enabled: !!year,
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
  });
}

export default useAnnualReport;
