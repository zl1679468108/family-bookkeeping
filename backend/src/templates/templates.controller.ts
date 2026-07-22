import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { TemplatesService } from './templates.service';
import { RecurringService } from './recurring.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ExecuteTemplateDto } from './dto/execute-template.dto';
import { ReorderTemplateDto } from './dto/reorder-template.dto';

@Controller('templates')
@UseGuards(TokenAuthGuard)
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly recurringService: RecurringService,
  ) {}

  /** GET /templates — 獲取用戶模板列表，按 sort_order 排序 */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
  ) {
    const data = await this.templatesService.findAll(userId, bookId);
    return { message: '獲取模板列表成功', data };
  }

  /**
   * PUT /templates/reorder — 批量重排模板順序
   * 注意：此路由必須放在 :id 之前，避免 "reorder" 被當作 :id 匹配
   */
  @Put('reorder')
  async reorder(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderTemplateDto,
  ) {
    await this.templatesService.reorder(userId, dto.ids);
    return { message: '重排模板成功', data: null };
  }

  /** POST /templates — 創建模板 */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Body() dto: CreateTemplateDto,
  ) {
    const data = await this.templatesService.create(userId, bookId, dto);
    return { message: '創建模板成功', data };
  }

  /** PUT /templates/:id — 編輯模板 */
  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const data = await this.templatesService.update(id, userId, dto);
    return { message: '更新模板成功', data };
  }

  /** DELETE /templates/:id — 刪除模板 */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.templatesService.remove(id, userId);
    return { message: '刪除模板成功', data: null };
  }

  /** POST /templates/:id/execute — 執行模板，插入 transactions 表 */
  @Post(':id/execute')
  @HttpCode(HttpStatus.CREATED)
  async execute(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ExecuteTemplateDto,
  ) {
    const data = await this.templatesService.execute(id, userId, dto.amount);
    return { message: '執行模板成功', data };
  }

  /** POST /templates/execute-recurring — 執行所有到期的週期模板 */
  @Post('execute-recurring')
  @HttpCode(HttpStatus.OK)
  async executeRecurring(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
  ) {
    const result = await this.recurringService.executeDueRecurrings(userId, bookId);
    return {
      message: '週期模板執行完成',
      data: result,
    };
  }
}
