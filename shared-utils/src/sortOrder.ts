/** 列表排序纯函数 — PC useSort / Taro useReorder 共用 */

export type SortOrderItem = { id: string; sort_order: number }

export type SortSaveDecision = 'empty' | 'unchanged' | 'changed'

/** id 数组 → 后端常见 { id, sort_order } 载荷 */
export function toSortOrders(ids: string[]): SortOrderItem[] {
  return ids.map((id, sort_order) => ({ id, sort_order }))
}

/** 两个 id 序列是否完全一致 */
export function isSameIdOrder(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((id, i) => id === b[i])
}

/** 保存前决策：空列表 / 未变化 / 需提交 */
export function decideSortSave(
  originalIds: readonly string[],
  orderedIds: readonly string[],
): SortSaveDecision {
  if (orderedIds.length === 0) return 'empty'
  if (isSameIdOrder(originalIds, orderedIds)) return 'unchanged'
  return 'changed'
}

/** 相邻交换（↑/↓ 按钮）；越界返回 null */
export function swapAdjacent<T>(
  items: readonly T[],
  index: number,
  direction: 'up' | 'down',
): T[] | null {
  const j = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || index >= items.length || j < 0 || j >= items.length) return null
  const next = items.slice()
  const tmp = next[index]
  next[index] = next[j]
  next[j] = tmp
  return next
}

/** 任意两下标交换（拖拽经过时常用） */
export function swapIndices<T>(items: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items.slice()
  }
  const next = items.slice()
  const tmp = next[from]
  next[from] = next[to]
  next[to] = tmp
  return next
}
