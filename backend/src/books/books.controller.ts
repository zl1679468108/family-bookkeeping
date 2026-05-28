import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BooksService } from './books.service';
import { CreateBookDto, InviteMemberDto, RenameBookDto } from './dto/book.dto';

@Controller('books')
@UseGuards(TokenAuthGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /** GET /api/books — 列出当前用户的账本 */
  @Get()
  async list(@CurrentUser('id') userId: string) {
    const data = await this.booksService.listByUser(userId);
    return { message: '获取账本列表成功', data };
  }

  /** GET /api/books/:id — 获取单个账本 */
  @Get(':id')
  async getById(@Param('id') bookId: string) {
    const data = await this.booksService.getById(bookId);
    return { message: '获取账本详情成功', data };
  }

  /** POST /api/books — 创建账本 */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookDto,
  ) {
    const data = await this.booksService.create(userId, dto.name);
    return { message: '创建账本成功', data };
  }

  /** PUT /api/books/:id — 重命名账本 */
  @Put(':id')
  async rename(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
    @Body() dto: RenameBookDto,
  ) {
    const data = await this.booksService.rename(bookId, userId, dto.name);
    return { message: '重命名成功', data };
  }

  /** DELETE /api/books/:id — 删除账本 */
  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.delete(bookId, userId);
    return data;
  }

  /** GET /api/books/:id/members — 获取账本成员 */
  @Get(':id/members')
  async getMembers(@Param('id') bookId: string) {
    const data = await this.booksService.getMembers(bookId);
    return { message: '获取成员列表成功', data };
  }

  /** POST /api/books/:id/members — 邀请成员 */
  @Post(':id/members')
  async inviteMember(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const data = await this.booksService.inviteMember(bookId, userId, dto.email);
    return data;
  }

  /** DELETE /api/books/:id/members/me — 退出账本 */
  @Delete(':id/members/me')
  async leave(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.leave(bookId, userId);
    return data;
  }
}
