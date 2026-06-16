import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchAnnualReport } from '../services/reportsApi';

/**
 * 年度报告数据 Hook
 */
export function useAnnualReport(year: number, bookId?: string) {
  const queryClient = useQueryClient();

  // 当年份变化时，立即清除缓存
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['annual-report', year, bookId] });
  }, [year, bookId, queryClient]);

  return useQuery({
    queryKey: ['annual-report', year, bookId],
    queryFn: () => fetchAnnualReport(year, bookId),
    enabled: !!year,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export default useAnnualReport;
