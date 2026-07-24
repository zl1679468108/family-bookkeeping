import type { CreateTransactionInput } from "../../types";

/** 记一笔表单 → API payload（新建/编辑共用） */
export function buildTransactionPayload(input: {
  type: "expense" | "income";
  amount: string;
  categoryId: string | number;
  date: string;
  brand?: string;
  note?: string;
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  /** 编辑时已保存的图片 URL */
  savedImages?: string[];
  withSavedImages?: boolean;
}): CreateTransactionInput {
  const payload: CreateTransactionInput = {
    type: input.type,
    amount: parseFloat(input.amount),
    category: String(input.categoryId),
    date: input.date,
    brand: input.brand || undefined,
    description: input.note || undefined,
    latitude: input.location?.latitude,
    longitude: input.location?.longitude,
    location_name: input.location?.name || undefined,
  };
  if (input.withSavedImages && input.savedImages && input.savedImages.length > 0) {
    payload.image_urls = JSON.stringify(input.savedImages);
  }
  return payload;
}
