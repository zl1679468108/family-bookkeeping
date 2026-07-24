/** 异步操作文案（按钮 / loading / toast 标题） */

export const ACTION_LOADING = '加载中...'
export const ACTION_PULL_LOAD_MORE = '上拉加载更多'
export const ACTION_LIST_END = '— 已经到底了 —'
export const ACTION_ADD_IMAGE = '添加图片'
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
export const ACTION_CREATING_ELLIPSIS = '创建中…'
export const ACTION_UPDATING_ELLIPSIS = '更新中…'
export const ACTION_SWITCHING = '切换中...'
export const NAV_PREV_MONTH = '上一月'
export const NAV_NEXT_MONTH = '下一月'
export const ACTION_LOGOUT = '退出登录'
export const ACTION_CONTACT_SUPPORT = '联系客服'
export const ACTION_LOGGING_OUT = '退出中...'
export const ACTION_PROMOTE = '升级'
export const ACTION_DEMOTE = '降级'
export const ACTION_CLOSE = '关闭'
export const ACTION_CLEAR = '清空'
export const ACTION_SELECT_LOCATION = '选择地点'
export const ACTION_CLEAR_SELECTION = '清除'
export const ACTION_SHOW_PASSWORD = '显示密码'
export const ACTION_HIDE_PASSWORD = '隐藏密码'
export const ACTION_EXPAND = '展开'
export const ACTION_COLLAPSE = '折叠'
export const ACTION_REMOVE_ACCOUNT = '移除账号'
export const ACTION_GO_SETTINGS = '去设置'
export const ACTION_GO_SET_BUDGET = '去设置预算'
export const ACTION_DECLINE = '不了'
export const ACTION_START_BOOKKEEPING = '开始记账'
export const ACTION_GO_ADD_TRANSACTION = '去记一笔'
export const ACTION_ADD_FIRST_TRANSACTION = '添加第一笔交易'
export const ACTION_ADD = '添加'
export const ACTION_ADDING = '添加中'
export const ACTION_LOCATE = '定位'
export const ACTION_LOCATING = '定位中'
export const ACTION_LOCATING_CURRENT_ELLIPSIS = '正在定位当前位置…'
export const ACTION_CANCEL = '取消'
export const ACTION_SAVE = '保存'
export const ACTION_SAVE_AS_IMAGE = '📷 保存为图片'
export const ACTION_DELETE = '删除'
export const ACTION_CONFIRM = '确认'
export const ACTION_VIEW_MERCHANT_LIST = '点击查看商户列表'
export const ACTION_OPEN_IN_NEW_WINDOW = '点击在新窗口打开'
export const ACTION_CREATE = '创建'
export const ACTION_UPDATE = '更新'
export const ACTION_EDIT = '编辑'
export const ACTION_CLICK_TO_EDIT = '点击修改'
export const ACTION_COPY = '复制'
export const ACTION_COPY_LAST_MONTH = '复制上月'
export const ACTION_SWITCH_ACCOUNT = '切换账号'
export const ACTION_SWITCH_THEME = '切换主题'
export const ACTION_DEACTIVATE_ACCOUNT = '注销账号'
export const THEME_DARK_MODE = '暗色模式'
export const THEME_LIGHT_MODE = '亮色模式'
export const THEME_MODE_LIGHT = '浅色'
export const THEME_MODE_DARK = '暗色'
export const THEME_MODE_SYSTEM = '跟随系统'
export const ACTION_EXECUTE = '执行'
export const ACTION_DELETE_BOOK = '删除账本'
export const ACTION_DELETE_THIS_TXN = '删除此笔'
export const ACTION_SEARCH = '搜索'
export const ACTION_SEARCH_ELLIPSIS = '搜索…'
export const ACTION_SEARCH_DOTS = '搜索...'
export const ACTION_SEARCHING = '搜索中...'
export const ACTION_SEARCHING_ELLIPSIS = '搜索中…'
export const ACTION_REMOVE = '移除'
export const ACTION_REMOVE_MEMBER = '移除成员'
export const ACTION_BOOKKEEPING_ELLIPSIS = '记账中…'
export const ACTION_UPLOADING_ELLIPSIS = '上传中…'
export const ACTION_JOIN_BOOK = '加入账本'
export const ACTION_JOINING = '加入中...'
export const ACTION_JOINING_ELLIPSIS = '加入中…'
export const ACTION_GENERATING = '生成中...'
export const ACTION_GENERATING_ELLIPSIS = '生成中…'
export const ACTION_REMOVING = '移除中...'
export const ACTION_REMOVING_ELLIPSIS = '移除中…'
export const ACTION_TRANSFERRING_ELLIPSIS = '转移中…'
export const ACTION_DEACTIVATING = '注销中...'
export const ACTION_CONFIRM_DEACTIVATE = '确认注销'
export const ACTION_OCR = 'OCR识别'
export const ACTION_OCR_PROCESSING = '识别中...'
export const ACTION_UPLOAD = '上传'
export const ACTION_UPLOAD_ICON = '＋ 上传图标'
export const ACTION_UPLOADING = '上传中'
export const ACTION_INVITE_MEMBER = '邀请成员'
export const ACTION_SWITCH_BOOK = '切换账本'
export const ACTION_SWITCH_TO_BOOK = '切换到此账本'
export const ACTION_CONFIRM_SWITCH = '确认切换'

/** busy ? busyText : idleText */
export function busyLabel(busy: boolean, busyText: string, idleText: string): string {
  return busy ? busyText : idleText
}

export function savingLabel(busy: boolean, idleText = ACTION_SAVE): string {
  return busyLabel(busy, ACTION_SAVING, idleText)
}

export function deletingLabel(busy: boolean, idleText = ACTION_DELETE): string {
  return busyLabel(busy, ACTION_DELETING, idleText)
}

export function copyingLabel(busy: boolean, idleText = ACTION_COPY): string {
  return busyLabel(busy, ACTION_COPYING, idleText)
}

export function submittingLabel(busy: boolean, idleText = ACTION_CONFIRM): string {
  return busyLabel(busy, ACTION_SUBMITTING, idleText)
}

export function processingLabel(busy: boolean, idleText = ACTION_CONFIRM): string {
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

/** 表单脚：编辑 → 更新；新建 → 创建 */
export function updateOrCreateLabel(isEdit: boolean): string {
  return isEdit ? ACTION_UPDATE : ACTION_CREATE
}

export function joiningLabel(busy: boolean, idleText = ACTION_JOIN_BOOK): string {
  return busyLabel(busy, ACTION_JOINING, idleText)
}

export function generatingLabel(busy: boolean, idleText: string): string {
  return busyLabel(busy, ACTION_GENERATING, idleText)
}

export function searchingLabel(busy: boolean, idleText = ACTION_SEARCH): string {
  return busyLabel(busy, ACTION_SEARCHING, idleText)
}

export function ocrLabel(busy: boolean): string {
  return busyLabel(busy, ACTION_OCR_PROCESSING, ACTION_OCR)
}

/** 密码显隐按钮 a11y */
export function passwordVisibilityLabel(visible: boolean): string {
  return visible ? ACTION_HIDE_PASSWORD : ACTION_SHOW_PASSWORD
}

/** 侧栏折叠 a11y/title */
export function collapseToggleLabel(collapsed: boolean): string {
  return collapsed ? ACTION_EXPAND : ACTION_COLLAPSE
}
