/** 用户展示名 / 头像字 —— 列表、侧栏、切换账号共用 */

export type UserLike = {
  username?: string | null
  email?: string | null
  name?: string | null
} | null | undefined

export const USER_FALLBACK = '用户'
export const USER_UNNAMED = '未命名用户'

/** 优先 username，其次 email / name */
export function userDisplayName(user: UserLike, fallback = USER_FALLBACK): string {
  if (!user) return fallback
  return user.username || user.email || user.name || fallback
}

/**
 * 头像占位首字：优先中文汉字，否则首字母大写。
 */
export function userInitial(user: UserLike, fallback = '?'): string {
  const name = userDisplayName(user, '')
  if (!name) return fallback
  const chineseChar = name.match(/[\u4e00-\u9fa5]/)
  if (chineseChar) return chineseChar[0]
  return name.charAt(0).toUpperCase() || fallback
}
