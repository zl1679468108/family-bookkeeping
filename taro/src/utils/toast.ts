/**
 * toast — 统一轻提示封装（对齐 PC notify 语义）
 * 内部用 Taro.showToast，颜色语义对齐 --inc/--exp/--info
 */
import Taro from "@tarojs/taro";

export type ToastType = "success" | "error" | "info" | "warn";

export function toast(
  message: string,
  type: ToastType = "info",
  duration = 2000
): void {
  const iconMap: Record<ToastType, "success" | "error" | "none" | "loading"> = {
    success: "success",
    error: "error",
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
