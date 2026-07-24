import { cx, type ClassValue } from './cx'

/**
 * IconGrid 纯逻辑 — 选择态 / 分区显示 / 栅格列
 * 不含 React；端侧负责渲染与上传 IO
 */

/** 预设图标是否选中 */
export function isIconOptionActive(
  selected: string | null | undefined,
  optionValue: string,
): boolean {
  return selected != null && selected !== '' && selected === optionValue
}

/** 自定义图标是否选中（兼容 id 或 url 作为 value） */
export function isCustomIconActive(
  selected: string | null | undefined,
  iconId: string,
  iconUrl: string,
): boolean {
  if (selected == null || selected === '') return false
  return selected === iconId || selected === iconUrl
}

/** 是否展示自定义区（有上传能力或已有自定义图标） */
export function hasCustomIconSection(
  canUpload: boolean,
  customCount: number,
): boolean {
  return Boolean(canUpload) || (Number(customCount) || 0) > 0
}

/** CSS grid-template-columns */
export function iconGridTemplateColumns(columns: number): string {
  const n = Math.max(1, Math.floor(Number(columns) || 1))
  return `repeat(${n}, 1fr)`
}

/**
 * IconGrid 根 class
 * @param mode pc: icon-grid-wrapper；bem: ui-icon-grid
 */
export function buildIconGridRootClassName(opts: {
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const mode = opts.mode || 'pc'
  const prefix = opts.prefix || (mode === 'bem' ? 'ui-icon-grid' : 'icon-grid-wrapper')
  return cx(prefix, opts.className)
}

/** 选项/自定义项 class */
export function buildIconGridItemClassName(opts: {
  active?: boolean
  labeled?: boolean
  upload?: boolean
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const mode = opts.mode || 'pc'
  if (mode === 'bem') {
    const prefix = opts.prefix || 'ui-icon-grid__item'
    return cx(
      prefix,
      opts.active && `${prefix}--active`,
      opts.labeled && `${prefix}--labeled`,
      opts.upload && 'ui-icon-grid__upload',
      opts.className,
    )
  }
  const prefix = opts.prefix || 'icon-btn'
  return cx(
    prefix,
    opts.active && 'active',
    opts.upload && 'icon-btn-upload',
    opts.className,
  )
}

/** 删除按钮 class（PC） */
export function buildIconGridDeleteClassName(opts: {
  loading?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'icon-btn-delete'
  return cx(prefix, opts.loading && `${prefix}--loading`, opts.className)
}

