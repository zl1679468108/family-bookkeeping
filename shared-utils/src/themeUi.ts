/**
 * Theme UI copy — PC theme toggle
 */

export function themeToggleTitle(currentLabel: string, nextLabel: string): string {
  return `当前: ${currentLabel}，点击切换为 ${nextLabel}`
}

export function themeToggleAriaLabel(currentLabel: string): string {
  return `切换主题，当前为${currentLabel}`
}
