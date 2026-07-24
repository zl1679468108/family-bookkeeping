import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchAnnualReport } from '../services/reportsApi';
import { useBook } from './useBook';
import { queryKeys } from '../utils/queryKeys';
import { STALE } from '../utils/cachePolicy';

/**
 * 年度报告数据 Hook
 */
export function useAnnualReport(year: number) {
  const queryClient = useQueryClient();
  const { currentBook } = useBook();
  const bookId = currentBook?.id || '';

  // 当年份变化时，清除该年缓存，避免脏数据
  useEffect(() => {
    if (!bookId || !year) return;
    queryClient.removeQueries({ queryKey: queryKeys.annualReport.year(bookId, year) });
  }, [year, bookId, queryClient]);

  return useQuery({
    queryKey: queryKeys.annualReport.year(bookId, year),
    queryFn: () => fetchAnnualReport(year),
    enabled: !!year && !!bookId,
    staleTime: STALE.annualReport,
    refetchOnWindowFocus: false,
  });
}

export default useAnnualReport;
