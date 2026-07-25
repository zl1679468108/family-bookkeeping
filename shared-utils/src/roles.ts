/** 角色文案 —— 账本成员 / 平台用户 */

export type BookMemberRole = 'owner' | 'admin' | 'member'

/** 账本成员角色：owner → 账主 */
export function bookMemberRoleLabel(role?: string | null, fallback = ''): string {
  if (role === 'owner') return '账主'
  if (role === 'admin') return '管理员'
  if (role === 'member') return '成员'
  return fallback || (role ?? '')
}

export function isBookOwnerRole(role?: string | null): boolean {
  return role === 'owner'
}

/** 平台用户角色（Admin 后台）：admin / user */
export function platformUserRoleLabel(role?: string | null): string {
  return role === 'admin' ? '管理员' : '普通用户'
}

export function isPlatformAdmin(role?: string | null): boolean {
  return role === 'admin'
}

export function buildPlatformRoleTagClassName(role?: string | null): string {
  return isPlatformAdmin(role) ? 'tag tag--primary' : 'tag tag--default'
}
