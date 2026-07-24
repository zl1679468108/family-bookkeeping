/**
 * Canvas 图片压缩工具
 * 将图片缩放至指定宽度，输出 JPEG Blob
 */
import { fitWithinMaxWidth } from './imageSize'
import { IMAGE_COMPRESS_FAILED, IMAGE_LOAD_FAILED } from './uploadCopy'

export function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.7,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const size = fitWithinMaxWidth(img.width, img.height, maxWidth)
      const width = size.width
      const height = size.height

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(IMAGE_COMPRESS_FAILED));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(IMAGE_LOAD_FAILED));
    };

    img.src = url;
  });
}
