/**
 * useReorder — 列表「排序模式」共享 Hook（按钮式相邻交换）
 *
 * 用于分类 / 模板等需要「进入排序模式 → ↑/↓ 相邻交换 → 保存顺序」的列表页。
 * 把各页面重复的 sortMode / sortOrder / handleMove* / handleSaveSort 逻辑收敛到此，
 * 通过 onSave 回调适配不同后端的请求体形状：
 *   - 分类：onSave: (ids) => reorderCategories(ids.map((id,i)=>({id, sort_order:i})))
 *   - 模板：onSave: (ids) => reorderTemplates({ ids })
 *
 * 说明：当前为按钮式相邻交换（非真拖拽）。若日后要做手势拖拽，只需在 onDragEnd
 * 里重排 sortOrder 再调 save() 即可，本 Hook 的 moveUp/moveDown/save 完全复用。
 *
 * Usage:
 *   const { sortMode, sortOrder, displayList,
 *           enter, cancel, moveUp, moveDown, save } = useReorder<ItemType>({
 *     items: baseList,                 // 非排序模式下的基准有序列表
 *     getKey: (item) => item.id,
 *     onSave: (orderedIds) => reorderApi({ ids: orderedIds }),
 *     queryKey: ["categories"],
 *     queryClient: qc,
 *     refetch: () => refetch(),
 *   });
 */
import { useState, useCallback } from "react";
import Taro from "@tarojs/taro";
import type { QueryClient } from "@tanstack/react-query";
import { useSubmit } from "./useSubmit";

export interface UseReorderOptions<T> {
  /** 非排序模式下的基准有序列表（已按 sort_order 排好） */
  items: T[];
  /** 从 item 取唯一 id */
  getKey: (item: T) => string;
  /** 保存回调：接收排序后的 id 数组（从前往后），由调用方拼成各自后端要求的请求体 */
  onSave: (orderedIds: string[]) => Promise<void>;
  /** react-query 失效 key，保存后刷新列表 */
  queryKey: string[];
  /** QueryClient 实例 */
  queryClient: QueryClient;
  /** 保存成功后重新拉取（useManualQuery 的 refetch） */
  refetch: () => void;
  /** 保存成功提示文案，默认「排序已保存」 */
  successText?: string;
}

export interface UseReorderResult<T> {
  /** 是否处于排序模式 */
  sortMode: boolean;
  /** 排序模式下的临时顺序列表 */
  sortOrder: T[];
  /** 渲染用列表：排序模式返回 sortOrder，否则返回 items */
  displayList: T[];
  /** 进入排序模式（以 items 初始化临时顺序） */
  enter: () => void;
  /** 退出排序模式（丢弃未保存顺序） */
  cancel: () => void;
  /** 第 index 项与上一项目交换 */
  moveUp: (index: number) => void;
  /** 第 index 项与下一项目交换 */
  moveDown: (index: number) => void;
  /** 将第 from 项移动到 to 位置（支持长按拖拽重排） */
  moveTo: (from: number, to: number) => void;
  /** 保存当前顺序到后端 */
  save: () => void;
}

export function useReorder<T>({
  items,
  getKey,
  onSave,
  queryKey,
  queryClient,
  refetch,
  successText = "排序已保存",
}: UseReorderOptions<T>): UseReorderResult<T> {
  const { run } = useSubmit();
  const [sortMode, setSortMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<T[]>([]);

  const displayList = sortMode && sortOrder.length > 0 ? sortOrder : items;

  const enter = useCallback(() => {
    setSortOrder([...items]);
    setSortMode(true);
  }, [items]);

  const cancel = useCallback(() => {
    setSortMode(false);
    setSortOrder([]);
  }, []);

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...sortOrder];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      setSortOrder(next);
    },
    [sortOrder],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= sortOrder.length - 1) return;
      const next = [...sortOrder];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      setSortOrder(next);
    },
    [sortOrder],
  );

  const moveTo = useCallback(
    (from: number, to: number) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= sortOrder.length ||
        to >= sortOrder.length
      )
        return;
      const next = [...sortOrder];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setSortOrder(next);
    },
    [sortOrder],
  );

  const save = useCallback(() => {
    if (sortOrder.length === 0) {
      Taro.showToast({ title: "无需保存", icon: "none" });
      return;
    }
    const orderedIds = sortOrder.map((item) => getKey(item));
    // 检查顺序是否真的变化了（避免无变化的空保存请求）
    const originalIds = items.map((item) => getKey(item));
    const changed = orderedIds.some((id, i) => id !== originalIds[i]);
    if (!changed) {
      Taro.showToast({ title: "顺序未变化", icon: "none" });
      setSortMode(false);
      setSortOrder([]);
      return;
    }
    console.log("[useReorder] 保存排序:", { from: originalIds, to: orderedIds });
    run(async () => {
      await onSave(orderedIds);
      console.log("[useReorder] onSave 成功，开始失效缓存 + 刷新列表");
      queryClient.invalidateQueries({ queryKey });
      Taro.showToast({ title: successText, icon: "success" });
      setSortMode(false);
      setSortOrder([]);
      // 确保先退出排序模式再刷新列表，避免 displayList 在排序模式下的特殊分支
      await Promise.resolve();
      console.log("[useReorder] 调用 refetch 刷新列表");
      refetch();
    }, "保存中…").catch((err: any) => {
      console.error("[useReorder] 保存失败:", err);
      Taro.showToast({
        title: err?.message || "排序保存失败",
        icon: "none",
      });
    });
  }, [sortOrder, items, getKey, onSave, queryClient, queryKey, refetch, successText, run]);

  return {
    sortMode,
    sortOrder,
    displayList,
    enter,
    cancel,
    moveUp,
    moveDown,
    moveTo,
    save,
  };
}
