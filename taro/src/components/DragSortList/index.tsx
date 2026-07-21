/**
 * DragSortList — 通用长按拖拽排序列表（小程序友好，已修复 touchmove 失效）
 *
 * 实现要点：
 * - touchstart 在每个 item 上：启动长按定时器，但 dragIndexRef 在定时器触发后才置位
 * - touchmove 在每个 item 上，并用 catchMove 拦截冒泡+阻止页面滚动
 *   （旧版把 onTouchMove 绑在父容器，被 item 的 catchMove 拦截，永远不触发 — 这是 bug 根因）
 * - 拖拽中用 transform: translateY 跟随手指；松开时按当前 Y 位置计算目标 index
 * - 非拖拽项有让位动画
 *
 * 限制：
 * - 仅支持纵向单列
 * - 需要外部传入 itemHeight（rpx），所有项高度一致
 *
 * Usage:
 *   <DragSortList
 *     items={list}
 *     getKey={(x) => x.id}
 *     itemHeight={120}
 *     renderItem={(item, { active }) => <View>...</View>}
 *     onReorder={(from, to) => moveTo(from, to)}
 *   />
 */
import { useState, useRef, useCallback, ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";

export interface DragSortListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** 单项高度（rpx） */
  itemHeight: number;
  /** 渲染单项；第二参数提供 active 状态供样式区分 */
  renderItem: (item: T, state: { active: boolean }) => ReactNode;
  /** 拖拽结束触发重排回调 */
  onReorder: (from: number, to: number) => void;
  /** 列表外层 className */
  className?: string;
  /** 长按触发时长（ms），默认 350 */
  longPressMs?: number;
}

export function DragSortList<T>({
  items,
  getKey,
  itemHeight,
  renderItem,
  onReorder,
  className = "",
  longPressMs = 350,
}: DragSortListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0); // 拖拽项相对原位的 translateY（px）
  const startYRef = useRef(0); // 触摸起始 Y（px）
  const dragIndexRef = useRef<number | null>(null); // 仅在长按定时器触发后才置位
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemHeightPxRef = useRef(0);
  const containerTopRef = useRef(0);
  const dragOffsetRef = useRef(0); // 同步保存一份 ref，避免 touchend 时拿不到最新值

  // 测量列表容器顶部位置和单 item 高度（px）
  const measureLayout = useCallback(() => {
    return new Promise<{ top: number; itemHeight: number }>((resolve) => {
      const query = (require("@tarojs/taro") as typeof import("@tarojs/taro"))
        .createSelectorQuery();
      query.select(`.drag-sort-list__item`).boundingClientRect();
      query.select(`.drag-sort-list`).boundingClientRect();
      query.exec((res: any[]) => {
        const itemRect = res[0];
        const listRect = res[1];
        if (itemRect && listRect) {
          itemHeightPxRef.current = itemRect.height;
          containerTopRef.current = listRect.top;
          resolve({ top: listRect.top, itemHeight: itemRect.height });
        } else {
          resolve({ top: 0, itemHeight: 0 });
        }
      });
    });
  }, []);

  const handleTouchStart = (index: number) => (e: any) => {
    startYRef.current = e.touches[0].clientY;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    // 长按触发后才置位 dragIndexRef，避免滑动列表时误判进入拖拽态
    longPressTimerRef.current = setTimeout(async () => {
      await measureLayout();
      dragIndexRef.current = index;
      dragOffsetRef.current = 0;
      setDragOffset(0);
      setDragIndex(index);
    }, longPressMs);
  };

  // 关键修复：touchmove 绑在 item 上（不是父容器），并用 catchMove 拦截页面滚动
  const handleTouchMove = (e: any) => {
    if (dragIndexRef.current === null) {
      // 未进入拖拽态：取消长按定时器（避免滑动列表时误触发）
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }
    const y = e.touches[0].clientY;
    const offset = y - startYRef.current;
    dragOffsetRef.current = offset;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (dragIndexRef.current === null) {
      setDragIndex(null);
      setDragOffset(0);
      return;
    }
    const from = dragIndexRef.current;
    const itemH = itemHeightPxRef.current;
    if (itemH > 0) {
      const moveSteps = Math.round(dragOffsetRef.current / itemH);
      let to = from + moveSteps;
      to = Math.max(0, Math.min(items.length - 1, to));
      if (to !== from) {
        onReorder(from, to);
      }
    }
    dragIndexRef.current = null;
    dragOffsetRef.current = 0;
    setDragIndex(null);
    setDragOffset(0);
  };

  return (
    <View className={`drag-sort-list ${className}`}>
      <View
        style={{
          position: "relative",
          height: `${items.length * itemHeight}rpx`,
        }}
      >
        {items.map((item, index) => {
          const isActive = dragIndex === index;
          // 非拖拽项的位移动画：当拖拽项移到上方/下方时，让其它项让位
          let translateY = 0;
          if (dragIndex !== null && dragIndex !== index) {
            const itemH = itemHeightPxRef.current;
            if (itemH > 0) {
              const dragOffsetSteps = Math.round(dragOffset / itemH);
              const dragTo = Math.max(
                0,
                Math.min(items.length - 1, dragIndex + dragOffsetSteps),
              );
              if (dragIndex < index && dragTo >= index) {
                translateY = -itemH;
              } else if (dragIndex > index && dragTo <= index) {
                translateY = itemH;
              }
            }
          }
          return (
            <View
              key={getKey(item)}
              className={`drag-sort-list__item ${isActive ? "drag-sort-list__item--active" : ""}`}
              style={{
                height: `${itemHeight}rpx`,
                transform: isActive
                  ? `translateY(${dragOffset}px)`
                  : `translateY(${translateY}px)`,
                transition: isActive ? "none" : "transform 0.2s ease",
                zIndex: isActive ? 100 : 1,
                position: "absolute",
                top: `${index * itemHeight}rpx`,
                left: 0,
                right: 0,
              }}
              onTouchStart={handleTouchStart(index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              // catchMove 拦截 touchmove 冒泡到页面滚动容器，
              // 但不会拦截本元素自身绑定的 onTouchMove（事件先在本元素触发）
              catchMove
            >
              {renderItem(item, { active: isActive })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default DragSortList;
