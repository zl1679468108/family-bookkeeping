/** 周期模板频率文案（详情/列表共用） */
export const FREQUENCY_LABELS: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  quarterly: '每季度',
  yearly: '每年',
}

/** 非周期 / 不重复 */
export const FREQUENCY_NONE = '不重复'

export const FREQUENCY_OPTIONS = [
  { key: 'daily', label: '每天' },
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'quarterly', label: '每季度' },
  { key: 'yearly', label: '每年' },
] as const

export function formatFrequency(freq?: string | null): string {
  if (!freq) return ''
  return FREQUENCY_LABELS[freq] || freq
}

/** 含「不重复」的下拉选项（key 空串表示无频率） */
export const FREQUENCY_OPTIONS_WITH_NONE: ReadonlyArray<{ key: string; label: string }> = [
  { key: '', label: FREQUENCY_NONE },
  ...FREQUENCY_OPTIONS,
]
