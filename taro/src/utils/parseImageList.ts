/**
 * 清理 URL 字符串：去除首尾的反引号、空格、引号等异常字符
 */
const cleanUrl = (url: unknown): string => {
  if (typeof url !== "string") return "";
  return url.trim().replace(/^[`'"\s]+|[`'"\s]+$/g, "");
};

/**
 * 从交易记录中解析图片 URL 列表
 * 支持 image_url_list 数组和 image_urls JSON 字符串两种格式
 */
export const parseImageList = (tx: {
  image_url_list?: string[] | null;
  image_urls?: string | null;
}): string[] => {
  if (
    tx?.image_url_list &&
    Array.isArray(tx.image_url_list) &&
    tx.image_url_list.length > 0
  ) {
    return tx.image_url_list.map(cleanUrl).filter(Boolean);
  }
  if (tx?.image_urls) {
    try {
      const parsed = JSON.parse(tx.image_urls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(cleanUrl).filter(Boolean);
      }
    } catch {
      if (typeof tx.image_urls === "string" && tx.image_urls.includes(",")) {
        return tx.image_urls.split(",").map(cleanUrl).filter(Boolean);
      }
    }
  }
  return [];
};
