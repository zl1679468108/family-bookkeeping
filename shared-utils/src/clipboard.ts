/**
 * 剪贴板纯工具 — 端侧负责真正写入系统剪贴板
 */

/** 规范化待复制文本；空串返回 null */
export function normalizeClipboardText(text: unknown): string | null {
  const value = String(text ?? '')
  return value ? value : null
}
