import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookMembers } from '../services/mapApi';
import type { MapMember } from '@family-bookkeeping/shared-types'
import { queryKeys } from '../utils/queryKeys';
import { STALE } from '../utils/cachePolicy';

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

  const isMultiMember = members.length >= 2;

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!isMultiMember) return map;
    for (const member of members) {
      map.set(member.userId, member.color);
    }
    return map;
  }, [members, isMultiMember]);

  return { members, colorMap, isMultiMember, isLoading };
}
