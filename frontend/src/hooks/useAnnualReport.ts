import { useQuery } from '@tanstack/react-query';
import { fetchAnnualReport } from '../services/reportsApi';
import { useBook } from './useBook';
import { queryKeys } from '../utils/queryKeys';
import { GC_TIME_LONG, STALE } from '../utils/cachePolicy';

/**
 * 年度报告数据 Hook
 * - queryKey 含 bookId + year，切年/切账本自动隔离
 * - 不做 removeQueries：否则会在进入页面/改年份时立刻清掉正在用的缓存，导致白屏或反复 loading
 */
export function useAnnualReport(year: number) {
  const { currentBook } = useBook();
  const bookId = currentBook?.id || '';

  return useQuery({
    queryKey: queryKeys.annualReport.year(bookId, year),
    queryFn: () => fetchAnnualReport(year),
    enabled: !!year && !!bookId,
    staleTime: STALE.annualReport,
    gcTime: GC_TIME_LONG,
    refetchOnWindowFocus: false,
  });
}

export default useAnnualReport;
