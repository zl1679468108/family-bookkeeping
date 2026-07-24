/** 列表排序模式文案 */

export const SORT_EDIT = '编辑排序'
export const SORT_DONE = '完成排序'
export const SORT_SAVE = '保存排序'
export const SORT_SAVED = '排序已保存'

/** 工具栏：排序中显示「完成排序」，否则「编辑排序」 */
export function sortModeLabel(sorting: boolean): string {
  return sorting ? SORT_DONE : SORT_EDIT
}
export const SORT_NOTHING = '无需保存'
export const SORT_UNCHANGED = '顺序未变化'
