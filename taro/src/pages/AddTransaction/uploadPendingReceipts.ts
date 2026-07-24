import Taro from "@tarojs/taro";
import { uploadReceipt } from "../../services/transactionsApi";
import {
  emptyUploadPendingResult,
  uploadImagesProgressTitle,
  type UploadPendingResult,
} from "../../utils/uploadReceipts";

export type { UploadPendingResult };

/**
 * 串行上传本地待传图片，带进度 showLoading。
 * 与 PC 端 Promise.all 不同：小程序需展示进度且单路上传更稳。
 */
export async function uploadPendingReceipts(
  transactionId: number,
  pendingPaths: string[],
): Promise<UploadPendingResult> {
  if (!transactionId || pendingPaths.length === 0) {
    return emptyUploadPendingResult();
  }

  const uploadedUrls: string[] = [];
  let failedCount = 0;

  Taro.showLoading({ title: uploadImagesProgressTitle(0, pendingPaths.length) });
  try {
    for (let i = 0; i < pendingPaths.length; i++) {
      const filePath = pendingPaths[i];
      try {
        const res = await uploadReceipt(transactionId, filePath);
        if (res?.image_url) {
          uploadedUrls.push(res.image_url);
        } else {
          failedCount++;
          console.error("图片上传无返回 URL:", filePath);
        }
        Taro.showLoading({
          title: uploadImagesProgressTitle(i + 1, pendingPaths.length),
        });
      } catch (err) {
        failedCount++;
        console.error("图片上传失败:", filePath, err);
      }
    }
  } finally {
    Taro.hideLoading();
  }

  return { uploadedUrls, failedCount };
}
