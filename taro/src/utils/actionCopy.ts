/** 异步操作文案（按钮 / loading / toast 标题）— 与 PC 对齐 */

export const ACTION_LOADING = "加载中...";
export const ACTION_SAVING = "保存中...";
export const ACTION_DELETING = "删除中...";
export const ACTION_COPYING = "复制中...";
export const ACTION_SUBMITTING = "提交中...";

/** busy ? busyText : idleText */
export function busyLabel(busy: boolean, busyText: string, idleText: string): string {
  return busy ? busyText : idleText;
}

export function savingLabel(busy: boolean, idleText = "保存"): string {
  return busyLabel(busy, ACTION_SAVING, idleText);
}

export function deletingLabel(busy: boolean, idleText = "删除"): string {
  return busyLabel(busy, ACTION_DELETING, idleText);
}

export function copyingLabel(busy: boolean, idleText = "复制"): string {
  return busyLabel(busy, ACTION_COPYING, idleText);
}

export function submittingLabel(busy: boolean, idleText = "确认"): string {
  return busyLabel(busy, ACTION_SUBMITTING, idleText);
}
