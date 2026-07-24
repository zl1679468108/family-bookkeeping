/** 高频成功提示文案 */

export const SUCCESS_DELETED = '已删除'
export const SUCCESS_SAVED = '保存成功'
export const SUCCESS_BUDGET_SAVED = '预算保存成功'
export const SUCCESS_BUDGET_DELETED = '预算已删除'
export const SUCCESS_ICON_UPLOADED = '图标上传成功'
export const SUCCESS_ICON_DELETED = '图标已删除'
export const SUCCESS_INVITE_COPIED = '邀请码已复制'
export const SUCCESS_JOINED = '加入成功'
export const SUCCESS_CREATED = '创建成功'
export const SUCCESS_PASSWORD_CHANGED = '密码修改成功'
export const SUCCESS_ACCOUNT_SWITCHED = '账号切换成功'

/** 实体创建/更新：分类已创建 / 模板已更新 */
export function successEntityUpsert(entity: string, isEdit: boolean): string {
  return isEdit ? `${entity}已更新` : `${entity}已创建`
}

/** 交易保存：交易已更新 / 交易已保存 */
export function successTransactionSaved(isEdit: boolean): string {
  return isEdit ? '交易已更新' : '交易已保存'
}

export function successTemplateApplied(name: string): string {
  return `已应用模板：${name}`
}

export function successEntityDeleted(entity: string): string {
  return `${entity}已删除`
}

export const SUCCESS_INVITE_SENT = '邀请已发送'
export const SUCCESS_INVITE_CODE_GENERATED = '邀请码已生成'
export const SUCCESS_MEMBER_REMOVED = '成员已移除'
export const SUCCESS_BOOK_CREATED = '账本创建成功'
export const SUCCESS_UPDATED = '更新成功'
export const SUCCESS_LOGIN = '登录成功'
export const SUCCESS_REGISTER = '注册成功'
export const SUCCESS_CODE_SENT = '验证码已发送'
export const SUCCESS_PASSWORD_RESET = '密码重置成功'
export const SUCCESS_OWNERSHIP_TRANSFERRED = '所有权已转移'

export function successSwitchedBook(name: string): string {
  return `已切换到「${name}」`
}

export function successCopiedCount(count: number, noun = '条'): string {
  return `已复制 ${count} ${noun}`
}

export const SUCCESS_IMAGE_SELECTED = '已选择图片'
export const SUCCESS_AVATAR_UPDATED = '头像已更新'
export const SUCCESS_AVATAR_SELECTED_HINT = '头像已选择，点击保存生效'
export const SUCCESS_TEMPLATE_APPLIED = '模板已应用'
export const SUCCESS_CUSTOM_ICON_ADDED = '已添加自定义图标'

export const SUCCESS_ADDED_TO_CUSTOM = '已添加到自定义'
export const SUCCESS_ACCOUNT_DEACTIVATED = '账号已注销'
export const SUCCESS_SWITCHED = '切换成功'
export const SUCCESS_CODE_RESENT = '验证码已重新发送'
export const SUCCESS_OCR = 'OCR 识别成功，已自动填充表单'
export const SUCCESS_REFRESH = '刷新成功'
export const SUCCESS_REPORT_SAVED = '年度报告已保存为图片'
