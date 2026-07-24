/**
 * 分类名 → 背景语义色（双端再映射到 class / CSS 变量）
 */

export type CategoryBgTone = 'expense' | 'primary' | 'subtle'

const KEYWORD_TONE: Array<{ keywords: string[]; tone: CategoryBgTone }> = [
  { keywords: ['餐饮', '食物', '快餐', '购物', '衣服', '日用', '房租', '水电', '物业'], tone: 'expense' },
  {
    keywords: ['交通', '出行', '地铁', '公交', '娱乐', '游戏', '电影', '居家', '医疗', '健康', '教育', '学习', '工资', '兼职', '理财'],
    tone: 'primary',
  },
]

/** 根据分类名匹配背景 tone */
export function getCategoryBgTone(name: string): CategoryBgTone {
  const n = String(name ?? '')
  for (const row of KEYWORD_TONE) {
    if (row.keywords.some((k) => n.includes(k))) return row.tone
  }
  return 'subtle'
}

/** Taro / Tailwind 风格 class（历史兼容） */
export function getCategoryBgClass(name: string): string {
  const tone = getCategoryBgTone(name)
  if (tone === 'expense') return 'bg-expense-bg'
  if (tone === 'primary') return 'bg-primary-bg'
  return 'bg-subtle'
}

/** CSS 变量（PC 可用） */
export function getCategoryBgCssVar(name: string): string {
  const tone = getCategoryBgTone(name)
  if (tone === 'expense') return 'var(--expBg)'
  if (tone === 'primary') return 'var(--prBg)'
  return 'var(--bg)'
}
