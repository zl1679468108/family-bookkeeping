import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('请上传收据图片');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG/PNG/WebP 格式');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }

    return file;
  }
}
