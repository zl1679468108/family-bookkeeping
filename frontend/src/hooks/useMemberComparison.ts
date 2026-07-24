import { useQuery } from '@tanstack/react-query'
import { fetchMemberComparison } from '../services/statisticsApi'
import type { MemberComparisonParams } from '@family-bookkeeping/shared-types'
import { useBook } from './useBook'
import { queryKeys } from '../utils/queryKeys'
import { GC_TIME_LONG, STALE } from '../utils/cachePolicy'

export const useMemberComparison = (params: MemberComparisonParams | null) => {
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''

  return useQuery({
    queryKey: queryKeys.statistics.memberComparison(
      bookId,
      params?.month_from,
      params?.month_to,
    ),
    queryFn: () => fetchMemberComparison(params!),
    enabled: !!params && !!bookId,
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })
}
