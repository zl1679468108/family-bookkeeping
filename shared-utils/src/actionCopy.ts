/** 异步操作文案（按钮 / loading / toast 标题） */

export const ACTION_LOADING = '加载中...'
export const ACTION_VIEW_ALL = '全部'
export const ACTION_SAVING = '保存中...'
export const ACTION_SAVE_EDIT = '保存修改'
export const ACTION_CONFIRM_ADD = '确认添加'
export const ACTION_CREATE_CATEGORY = '创建分类'
export const ACTION_CREATE_BOOK = '创建账本'
export const ACTION_DELETING = '删除中...'
export const ACTION_COPYING = '复制中...'
export const ACTION_SUBMITTING = '提交中...'
export const ACTION_PROCESSING = '处理中...'
/** 部分场景用中文省略号 */
export const ACTION_PROCESSING_ELLIPSIS = '处理中…'
export const ACTION_SWITCHING = '切换中...'
export const NAV_PREV_MONTH = '上一月'
export const NAV_NEXT_MONTH = '下一月'
export const ACTION_LOGOUT = '退出登录'
export const ACTION_LOGGING_OUT = '退出中...'
export const ACTION_PROMOTE = '升级'
export const ACTION_DEMOTE = '降级'
export const ACTION_CLOSE = '关闭'
export const ACTION_CLEAR = '清空'
export const ACTION_START_BOOKKEEPING = '开始记账'
export const ACTION_GO_ADD_TRANSACTION = '去记一笔'
export const ACTION_ADD_FIRST_TRANSACTION = '添加第一笔交易'

/** busy ? busyText : idleText */
export function busyLabel(busy: boolean, busyText: string, idleText: string): string {
  return busy ? busyText : idleText
}

export function savingLabel(busy: boolean, idleText = '保存'): string {
  return busyLabel(busy, ACTION_SAVING, idleText)
}

export function deletingLabel(busy: boolean, idleText = '删除'): string {
  return busyLabel(busy, ACTION_DELETING, idleText)
}

export function copyingLabel(busy: boolean, idleText = '复制'): string {
  return busyLabel(busy, ACTION_COPYING, idleText)
}

export function submittingLabel(busy: boolean, idleText = '确认'): string {
  return busyLabel(busy, ACTION_SUBMITTING, idleText)
}

export function processingLabel(busy: boolean, idleText = '确认'): string {
  return busyLabel(busy, ACTION_PROCESSING, idleText)
}

/** 编辑态 → 保存修改；新建态 → createText */
export function saveOrCreateLabel(isEdit: boolean, createText = ACTION_CREATE_CATEGORY): string {
  return isEdit ? ACTION_SAVE_EDIT : createText
}

/** 记一笔：编辑 → 保存修改；新建 → 确认添加 */
export function saveOrConfirmAddLabel(isEdit: boolean): string {
  return isEdit ? ACTION_SAVE_EDIT : ACTION_CONFIRM_ADD
}
