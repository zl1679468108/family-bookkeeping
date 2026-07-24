/**
 * toast — 统一轻提示封装（对齐 PC notify / notifyError 语义）
 * 页面侧请用本文件，避免直接 Taro.showToast 导致风格不一。
 */
import Taro from "@tarojs/taro";
import { getErrorMessage } from "./errorMessage";
import { ERROR_OP_FAILED } from "./errorCopy";
import { TOAST_DEFAULT_MS } from "./timing";

export type ToastType = "success" | "error" | "info" | "warn";

export function toast(
  message: string,
  type: ToastType = "info",
  duration = TOAST_DEFAULT_MS,
): void {
  // Taro 原生 error icon 在部分基础库表现不稳定，错误统一 none + 文案
  const iconMap: Record<ToastType, "success" | "error" | "none" | "loading"> = {
    success: "success",
    error: "none",
    info: "none",
    warn: "none",
  };
  Taro.showToast({
    title: message,
    icon: iconMap[type],
    duration,
    mask: false,
  });
}

export function toastSuccess(message: string, duration = TOAST_DEFAULT_MS): void {
  toast(message, "success", duration);
}

export function toastInfo(message: string, duration = TOAST_DEFAULT_MS): void {
  toast(message, "info", duration);
}

export function toastWarn(message: string, duration = TOAST_DEFAULT_MS): void {
  toast(message, "warn", duration);
}

/** 错误提示：支持 unknown err 或纯文案 */
export function toastError(err: unknown, fallback = ERROR_OP_FAILED): void {
  toast(getErrorMessage(err, fallback), "error");
}
