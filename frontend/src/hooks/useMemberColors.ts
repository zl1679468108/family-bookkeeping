import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookMembers } from '../services/mapApi';
import type { MapMember } from '../types/map';

/**
 * useMemberColors — 获取账本成员列表并构建 userId → color 映射。
 *
 * 调用 fetchBookMembers() 获取成员列表（后端已分配颜色），
 * 通过 useMemo 缓存颜色映射表。单成员账本返回空 map，
 * 上游组件据此判断是否展示 P1 多成员功能 UI。
 *
 * @param bookId - 当前账本 ID，falsy 时不发起请求
 */
export function useMemberColors(
  bookId: string | undefined,
): {
  /** 成员列表（含后端分配的颜色） */
  members: MapMember[];
  /** userId → 颜色值的映射表，单成员时为空 */
  colorMap: Map<string, string>;
  /** 是否为多成员账本（≥2 人） */
  isMultiMember: boolean;
  /** 是否正在加载成员数据 */
  isLoading: boolean;
} {
  const { data: members = [], isLoading } = useQuery<MapMember[]>({
    queryKey: ['mapMembers', bookId],
    queryFn: () => fetchBookMembers(),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 成员列表 5 分钟内不重新请求
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
