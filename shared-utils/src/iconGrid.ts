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
