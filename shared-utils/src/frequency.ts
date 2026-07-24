/** 周期模板频率文案（详情/列表共用） */
export const FREQUENCY_LABELS: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  quarterly: '每季度',
  yearly: '每年',
}

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
