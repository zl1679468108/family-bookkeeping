/**
 * Icons API service — 自定义图标管理.
 * 对齐 PC 端 frontend/src/services/iconsApi.ts
 */
import Taro from "@tarojs/taro";
import { apiGet, apiDelete, API_BASE_URL, getToken, getStoredBookId } from "./api";
import type { CustomIcon } from "../types";
import { API_PATHS } from "../utils/apiPaths";

/** 获取自定义图标列表 */
export const fetchCustomIcons = (
  iconType?: "category" | "book" | "avatar",
): Promise<CustomIcon[]> => {
  const query = iconType ? `icon_type=${encodeURIComponent(iconType)}` : undefined;
  return apiGet<CustomIcon[]>(API_PATHS.icons.list(query), { requiresAuth: true });
};

/**
 * 上传自定义图标（使用 Taro.uploadFile，不走 request()）
 * 仿 uploadReceipt 模式
 */
export const uploadIcon = (
  filePath: string,
  iconType: "category" | "book" | "avatar",
): Promise<CustomIcon> => {
  const token = getToken();
  const bookId = getStoredBookId();
  const header: Record<string, string> = {};
  if (token) header["Authorization"] = `Bearer ${token}`;
  if (bookId) header["x-book-id"] = bookId;

  return Taro.uploadFile({
    url: `${API_BASE_URL}${API_PATHS.icons.upload}`,
    filePath,
    name: "file",
    formData: { icon_type: iconType },
    header,
  }).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const payload = JSON.parse(res.data);
        // API envelope unwrap
        if (payload && payload.data) {
          return payload.data as CustomIcon;
        }
        return payload as CustomIcon;
      } catch {
        throw new Error("图标上传解析失败");
      }
    }
    throw new Error("图标上传失败");
  });
};

/** 删除自定义图标 */
export const deleteIcon = (iconId: string): Promise<void> => {
  return apiDelete<void>(API_PATHS.icons.byId(iconId), { requiresAuth: true });
};
