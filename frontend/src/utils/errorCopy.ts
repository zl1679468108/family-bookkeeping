/** 操作失败 / 业务错误高频文案 */

export const ERROR_OP_FAILED = '操作失败'
export const ERROR_SAVE_FAILED = '保存失败'
export const ERROR_SAVE_FAILED_RETRY = '保存失败，请重试'
export const ERROR_CREATE_FAILED = '创建失败'
export const ERROR_CREATE_FAILED_RETRY = '创建失败，请重试'
export const ERROR_UPDATE_FAILED = '更新失败'
export const ERROR_DELETE_FAILED = '删除失败'
export const ERROR_LOGIN_FAILED = '登录失败'
export const ERROR_REGISTER_FAILED = '注册失败'
export const ERROR_JOIN_FAILED = '加入失败'
export const ERROR_INVITE_FAILED = '邀请失败'
export const ERROR_INVITE_EMAIL = '邀请失败，请检查邮箱'
export const ERROR_GENERATE_FAILED = '生成失败'
export const ERROR_GENERATE_INVITE_FAILED = '生成邀请码失败'
export const ERROR_REMOVE_FAILED = '移除失败'
export const ERROR_COPY_FAILED = '复制失败'
export const ERROR_COPY_BUDGET_FAILED = '复制上月预算失败'
export const ERROR_BUDGET_SAVE_FAILED = '预算保存失败'
export const ERROR_SORT_SAVE_FAILED = '排序保存失败'
export const ERROR_TRANSFER_FAILED = '转移失败'
export const ERROR_EXECUTE_FAILED = '执行失败'
export const ERROR_SEND_FAILED = '发送失败'
export const ERROR_RESET_FAILED = '重置失败'
export const ERROR_MODIFY_FAILED_RETRY = '修改失败，请重试'
export const ERROR_INVALID_INVITE = '邀请码无效或已过期'
export const ERROR_SESSION_EXPIRED = '登录状态已失效，请重新登录'
export const ERROR_OCR_FAILED = '未能识别票据内容，请重试或手动填写'
export const ERROR_DEACTIVATE_FAILED = '注销失败，请检查密码后重试'
export const ERROR_RECEIPTS_PARTIAL = (n: number) => `${n} 张图片上传失败，其余已保存`
export const ERROR_RECEIPTS_ALL = '图片上传失败，请检查网络后重试'

/** 创建失败 / 更新失败 */
export const ERROR_ROLE_UPDATE = '修改角色失败'
export const ERROR_STATUS_UPDATE = '修改状态失败'
export const ERROR_SWITCH_BOOK = '设置当前账本失败，请重试'
export const ERROR_REPORT_NOT_LOADED = '报告内容未加载'
export const ERROR_SAVE_IMAGE = '保存图片失败，请重试'
export const ERROR_REFRESH = '刷新失败'

export function failEntityUpsert(isEdit: boolean): string {
  return isEdit ? ERROR_UPDATE_FAILED : ERROR_CREATE_FAILED
}

/** 更新失败 / 保存失败（记一笔等） */
export function failUpdateOrSave(isEdit: boolean): string {
  return isEdit ? ERROR_UPDATE_FAILED : ERROR_SAVE_FAILED
}
