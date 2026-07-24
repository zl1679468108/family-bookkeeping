/** 复制到剪贴板（Taro） */
import Taro from "@tarojs/taro";
import { normalizeClipboardText } from "../../../shared-utils/src/clipboard";

export { normalizeClipboardText } from "../../../shared-utils/src/clipboard";

export async function copyToClipboard(text: string): Promise<boolean> {
  const value = normalizeClipboardText(text);
  if (!value) return false;
  try {
    await Taro.setClipboardData({ data: value });
    return true;
  } catch {
    return false;
  }
}
