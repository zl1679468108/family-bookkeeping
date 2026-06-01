import { useQuery } from '@tanstack/react-query';
import { fetchMemberComparison } from '../services/statisticsApi';
import type { MemberComparisonParams } from '../types/memberComparison';

export const useMemberComparison = (params: MemberComparisonParams | null) => {
  return useQuery({
    queryKey: ['statistics', 'member-comparison', params],
    queryFn: () => fetchMemberComparison(params!),
    enabled: !!params && !!params.book_id,
  });
};
