/** 复制到剪贴板（Taro） */
import Taro from "@tarojs/taro";

export async function copyToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? "");
  if (!value) return false;
  try {
    await Taro.setClipboardData({ data: value });
    return true;
  } catch {
    return false;
  }
}
