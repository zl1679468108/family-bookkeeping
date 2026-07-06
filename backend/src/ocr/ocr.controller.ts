import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { OcrService, OcrResult } from './ocr.service';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('ocr')
@UseGuards(TokenAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  /**
   * POST /api/ocr/receipt
   * 上传收据/账单图片进行 OCR 识别
   * 免费额度（500次/天）用完时返回 503 + 友好提示
   */
  @Post('receipt')
  @UseInterceptors(FileInterceptor('file'))
  async recognize(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    try {
      const result: OcrResult = await this.ocrService.recognize(file.buffer);
      return { message: 'OCR 识别成功', data: result };
    } catch (err) {
      // 免费额度用完的场景，直接透传
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      // 其他错误包装
      throw err;
    }
  }
}