import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IconsService } from './icons.service';
import { CreateIconDto, QueryIconDto } from './dto/icon.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('icons')
@UseGuards(TokenAuthGuard)
export class IconsController {
  constructor(private readonly iconsService: IconsService) {}

  /**
   * 获取用户自定义图标列表
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryIconDto,
  ) {
    const data = await this.iconsService.findAll(userId, query.icon_type);
    return { message: '获取图标列表成功', data };
  }

  /**
   * 上传图标图片
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('id') userId: string,
    @Body() body: CreateIconDto,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    const data = await this.iconsService.upload(userId, body.icon_type, file);
    return { message: '图标上传成功', data };
  }

  /**
   * 删除图标
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.iconsService.remove(id, userId);
    return { message: '图标删除成功', data: null };
  }
}
