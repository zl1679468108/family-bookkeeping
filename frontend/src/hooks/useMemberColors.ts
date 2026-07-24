import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookMembers } from '../services/mapApi';
import type { MapMember } from '@family-bookkeeping/shared-types'
import { queryKeys } from '../utils/queryKeys';
import { STALE } from '../utils/cachePolicy';
import { buildMemberColorMap, isMultiMember } from '../utils/memberColors';

export function useMemberColors(
  bookId: string | undefined,
): {
  members: MapMember[];
  colorMap: Map<string, string>;
  isMultiMember: boolean;
  isLoading: boolean;
} {
  const { data: members = [], isLoading } = useQuery<MapMember[]>({
    queryKey: queryKeys.map.members(bookId || ''),
    queryFn: () => fetchBookMembers(),
    enabled: !!bookId,
    staleTime: STALE.mapMembers,
  });

  const multi = isMultiMember(members);

  const colorMap = useMemo(
    () => buildMemberColorMap(members),
    [members],
  );

  return { members, colorMap, isMultiMember: multi, isLoading };
}
