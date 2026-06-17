import type { Transaction } from '../services/api';

/**
 * 从交易记录中解析图片 URL 列表
 * 支持 image_url_list 数组和 image_urls JSON 字符串两种格式
 */
export const parseImageList = (tx: Transaction): string[] => {
  if (tx?.image_url_list && Array.isArray(tx.image_url_list) && tx.image_url_list.length > 0) {
    return tx.image_url_list;
  }
  if (tx?.image_urls) {
    try {
      const parsed = JSON.parse(tx.image_urls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      if (typeof tx.image_urls === 'string' && tx.image_urls.includes(',')) {
        return tx.image_urls.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }
  return [];
};
