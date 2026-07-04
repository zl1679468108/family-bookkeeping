import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { fromBuffer } from 'file-type';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  private readonly extMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  async transform(file: Express.Multer.File | undefined): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('请上传收据图片');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }

    // T-H12: 校验文件头 magic bytes，防止客户端伪造 MIME type
    const fileType = await fromBuffer(file.buffer);
    if (!fileType || !this.allowedTypes.includes(fileType.mime)) {
      throw new BadRequestException('仅支持 JPG/PNG/WebP 格式的图片文件');
    }

    // 验证扩展名与 magic bytes 一致性
    const allowedExts = this.extMap[fileType.mime];
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext && !allowedExts?.includes(ext)) {
      throw new BadRequestException('文件扩展名与实际类型不匹配');
    }

    // 验证扩展名与客户端声明的 MIME 一致性（原有逻辑）
    const clientExtMap: Record<string, string[]> = {
      'jpeg': ['jpg', 'jpeg'],
      'png': ['png'],
      'webp': ['webp'],
    };
    const clientAllowedExts = clientExtMap[file.mimetype] || [];
    if (ext && !clientAllowedExts.includes(ext)) {
      throw new BadRequestException('文件扩展名与类型不匹配');
    }

    return file;
  }
}
