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
 */
import { useState, useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useSubmit, toastError } from "./useSubmit";
import { toastSuccess, toastInfo } from "../utils/toast";
import { ACTION_SAVING } from "../utils/actionCopy";
import { SORT_SAVED, SORT_NOTHING, SORT_UNCHANGED } from "../utils/sortCopy";
import { ERROR_SORT_SAVE_FAILED } from "../utils/errorCopy";
import { decideSortSave, swapAdjacent } from "../utils/sortOrder";

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
  successText = SORT_SAVED,
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
      setSortOrder((prev) => {
        const next = swapAdjacent(prev, index, "up");
        return next ?? prev;
      });
    },
    [],
  );

  const moveDown = useCallback(
    (index: number) => {
      setSortOrder((prev) => {
        const next = swapAdjacent(prev, index, "down");
        return next ?? prev;
      });
    },
    [],
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
    const originalIds = items.map((item) => getKey(item));
    const orderedIds = sortOrder.map((item) => getKey(item));
    const decision = decideSortSave(originalIds, orderedIds);

    if (decision === "empty") {
      toastInfo(SORT_NOTHING);
      return;
    }
    if (decision === "unchanged") {
      toastInfo(SORT_UNCHANGED);
      setSortMode(false);
      setSortOrder([]);
      return;
    }

    run(async () => {
      try {
        await onSave(orderedIds);
        toastSuccess(successText);
        setSortMode(false);
        setSortOrder([]);
        queryClient.invalidateQueries({ queryKey });
        refetch();
      } catch (e: unknown) {
        toastError(e, ERROR_SORT_SAVE_FAILED);
      }
    }, ACTION_SAVING);
  }, [
    sortOrder,
    items,
    getKey,
    onSave,
    successText,
    queryClient,
    queryKey,
    refetch,
    run,
  ]);

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
