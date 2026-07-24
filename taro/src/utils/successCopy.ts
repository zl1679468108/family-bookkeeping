/** 高频成功提示文案 — 与 PC 对齐 */

export const SUCCESS_DELETED = "已删除";
export const SUCCESS_SAVED = "保存成功";
export const SUCCESS_BUDGET_SAVED = "预算保存成功";
export const SUCCESS_BUDGET_DELETED = "预算已删除";
export const SUCCESS_ICON_UPLOADED = "图标上传成功";
export const SUCCESS_ICON_DELETED = "图标已删除";
export const SUCCESS_INVITE_COPIED = "邀请码已复制";
export const SUCCESS_JOINED = "加入成功";
export const SUCCESS_CREATED = "创建成功";
export const SUCCESS_PASSWORD_CHANGED = "密码修改成功";
export const SUCCESS_ACCOUNT_SWITCHED = "账号切换成功";

/** 实体创建/更新：分类已创建 / 模板已更新 */
export function successEntityUpsert(entity: string, isEdit: boolean): string {
  return isEdit ? `${entity}已更新` : `${entity}已创建`;
}

/** 交易保存：交易已更新 / 交易已保存 */
export function successTransactionSaved(isEdit: boolean): string {
  return isEdit ? "交易已更新" : "交易已保存";
}

export function successTemplateApplied(name: string): string {
  return `已应用模板：${name}`;
}

export function successEntityDeleted(entity: string): string {
  return `${entity}已删除`;
}
