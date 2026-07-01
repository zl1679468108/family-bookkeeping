import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BooksService } from './books.service';
import { AuthService } from '../auth/auth.service';
import { CreateBookDto, InviteMemberDto, UpdateBookDto, TransferOwnerDto, UpdateDescriptionDto } from './dto/book.dto';

@Controller('books')
@UseGuards(TokenAuthGuard)
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly authService: AuthService,
  ) {}

  /** GET /api/books — 列出当前用户的账本 */
  @Get()
  async list(@CurrentUser('id') userId: string) {
    const data = await this.booksService.listByUser(userId);
    return { message: '获取账本列表成功', data };
  }

  /** GET /api/books/:id — 获取单个账本（T-M1: 增加账本成员权限校验） */
  @Get(':id')
  async getById(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.getByIdWithMembershipCheck(bookId, userId);
    return { message: '获取账本详情成功', data };
  }

  /** GET /api/books/:id/check-owner — 检查当前用户是否是 Owner */
  @Get(':id/check-owner')
  async checkOwner(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.checkOwner(bookId, userId);
    return { message: '检查成功', ...data };
  }

  /** POST /api/books — 创建账本 */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookDto,
  ) {
    const data = await this.booksService.create(userId, dto.name, dto.description, dto.icon, dto.icon_id);
    return { message: '创建账本成功', data };
  }

  /** PUT /api/books/:id — 更新账本 */
  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
    @Body() dto: UpdateBookDto,
  ) {
    const data = await this.booksService.update(bookId, userId, dto.name, dto.description, dto.icon, dto.icon_id);
    return { message: '更新成功', data };
  }

  /** DELETE /api/books/:id — 删除账本 */
  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    await this.booksService.delete(bookId, userId);
    return { message: '删除账本成功', data: null };
  }

  /** GET /api/books/:id/members — 获取账本成员（T-M1: 增加账本成员权限校验） */
  @Get(':id/members')
  async getMembers(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.getMembersWithCheck(bookId, userId);
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

  /** DELETE /api/books/:id/members/:userId — 移除成员（Owner） */
  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser('id') ownerId: string,
    @Param('id') bookId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.booksService.removeMember(bookId, ownerId, targetUserId);
    return { message: '成员已移除' };
  }

  /** PUT /api/books/:id/transfer-owner — 转让 Owner */
  @Put(':id/transfer-owner')
  async transferOwner(
    @CurrentUser('id') currentOwnerId: string,
    @Param('id') bookId: string,
    @Body() dto: TransferOwnerDto,
  ) {
    // 先验证当前用户密码
    const isPasswordValid = await this.authService.validatePassword(currentOwnerId, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误，无法转让所有权');
    }
    await this.booksService.transferOwner(bookId, currentOwnerId, dto.newOwnerEmail);
    return { message: '所有权转让成功' };
  }

  /** PUT /api/books/:id/archive — 归档账本 */
  @Put(':id/archive')
  async archiveBook(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    await this.booksService.archiveBook(bookId, userId);
    return { message: '账本已归档' };
  }

  /** PUT /api/books/:id/unarchive — 取消归档 */
  @Put(':id/unarchive')
  async unarchiveBook(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    await this.booksService.unarchiveBook(bookId, userId);
    return { message: '账本已取消归档' };
  }

  /** PUT /api/books/:id/description — 更新账本描述 */
  @Put(':id/description')
  async updateDescription(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
    @Body() dto: UpdateDescriptionDto,
  ) {
    const data = await this.booksService.updateDescription(bookId, userId, dto.description);
    return { message: '描述已更新', data };
  }

  /** POST /api/books/:id/invitations — 生成邀请码（Owner 专用） */
  @Post(':id/invitations')
  async createInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') bookId: string,
  ) {
    const data = await this.booksService.generateInvitationCode(bookId, userId);
    return { message: '邀请码已生成', data };
  }

  /** GET /api/books/invitations/:code — 查询邀请码对应的账本信息 */
  @Get('invitations/:code')
  async getInvitation(@Param('code') code: string) {
    const data = await this.booksService.getInvitationByCode(code);
    if (!data) {
      return { success: false, message: '邀请码无效或已过期' };
    }
    return { success: true, message: '邀请码有效', data };
  }

  /** POST /api/books/invitations/:code/join — 使用邀请码加入账本 */
  @Post('invitations/:code/join')
  async joinByInvitation(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const data = await this.booksService.joinByInvitationCode(code, userId);
    return { message: '成功加入账本', data };
  }
}
