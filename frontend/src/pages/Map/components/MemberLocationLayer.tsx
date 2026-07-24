import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMemberLocations } from '../../../services/mapApi';
import type { MemberLocation } from '@family-bookkeeping/shared-types'
import { getThemeColors } from '../../../utils/themeColors'
import { queryKeys } from '../../../utils/queryKeys'
import { isMemberOffline } from '../../../utils/memberPresence'
import { createMemberBubbleHtml } from '../../../utils/mapMarkerHtml'

interface MemberLocationLayerProps {
  /** 当前账本 ID，undefined 时不渲染任何内容 */
  bookId?: string;
  /** 高德地图实例，null 时跳过渲染 */
  mapInstance: any;
}

/**
 * 创建成员位置气泡的 HTML 内容字符串（模板见 shared-utils/mapMarkerHtml）。
 */
function createBubbleContent(loc: MemberLocation, isOffline: boolean): string {
  const theme = getThemeColors();
  return createMemberBubbleHtml(loc.username, isOffline, {
    srf: theme.srf,
    fg: theme.fg,
    fg3: theme.fg3,
    info: theme.info,
  });
}

/**
 * MemberLocationLayer — 成员位置气泡图层。
 *
 * 使用 react-query 每 60s 轮询成员位置，通过原生 AMap API 在地图上
 * 添加/移除 Marker。超过 2 分钟未更新的成员显示为灰色离线状态。
 * bookId 为 undefined 或 mapInstance 为 null 时不渲染任何内容。
 *
 * 该组件不渲染 DOM 节点，所有渲染通过地图原生 API 完成。
 */
export const MemberLocationLayer: React.FC<MemberLocationLayerProps> = ({
  bookId,
  mapInstance,
}) => {
  const markersRef = useRef<any[]>([]);

  // 轮询成员位置，每 60s，避免地图页长时间打开时把后端持续点亮
  const { data: locations = [] } = useQuery<MemberLocation[]>({
    queryKey: queryKeys.map.memberLocations(bookId || ''),
    queryFn: fetchMemberLocations,
    enabled: !!bookId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  // 管理原生 AMap Marker 的生命周期
  useEffect(() => {
    if (!mapInstance || !bookId) return;

    const AMapWin = (window as any).AMap;
    if (!AMapWin?.Marker) return;

    // 清除旧 markers
    markersRef.current.forEach((m: any) => {
      m.setMap(null);
    });
    markersRef.current = [];

    // 为每个位置创建 Marker
    const now = Date.now();
    const newMarkers: any[] = [];

    for (const loc of locations) {
      const isOffline = isMemberOffline(loc.updatedAt, now);

      const content = createBubbleContent(loc, isOffline);

      const marker = new AMapWin.Marker({
        position: [loc.longitude, loc.latitude],
        content: content,
        offset: new AMapWin.Pixel(0, -24), // 偏移使气泡指向位置正上方
        zIndex: isOffline ? 90 : 100,
      });

      if (isOffline) {
        marker.setTitle(`${loc.username} — 可能已离线`);
      }

      marker.setMap(mapInstance);
      newMarkers.push(marker);
    }

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((m: any) => m.setMap(null));
    };
  }, [locations, bookId, mapInstance]);

  // 组件不渲染任何 DOM 节点
  return null;
};
