/** 平台用户状态文案 / 样式（Admin 后台）— 纯函数，无 UI 依赖 */

export type PlatformUserStatus = 'active' | 'suspended' | 'deleted'

export const PLATFORM_USER_STATUS_OPTIONS: { key: PlatformUserStatus; label: string }[] = [
  { key: 'active', label: '正常' },
  { key: 'suspended', label: '停用' },
  { key: 'deleted', label: '已注销' },
]

export function platformUserStatusLabel(status?: string | null, fallback = '未知'): string {
  if (status === 'active') return '正常'
  if (status === 'suspended') return '停用'
  if (status === 'deleted') return '已注销'
  return fallback
}

/** status badge className：status status--success|danger|muted */
export function platformUserStatusClass(status?: string | null): string {
  if (status === 'active') return 'status status--success'
  if (status === 'suspended') return 'status status--danger'
  return 'status status--muted'
}

/** 行内操作：当前正常 →「停用」，否则「启用」 */
export function platformUserStatusActionLabel(status?: string | null): string {
  return status === 'active' ? '停用' : '启用'
}
