/** 统一错误文案提取 — 与 PC 对齐 */
export function getErrorMessage(err: unknown, fallback = "操作失败"): string {
  if (!err) return fallback;
  if (typeof err === "string" && err.trim()) return err;
  const anyErr = err as { message?: string; error?: string; msg?: string };
  return anyErr?.message || anyErr?.error || anyErr?.msg || fallback;
}
