import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import {
  QueryUsersDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  QueryAdminTransactionsDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(TokenAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/admin/stats
   * 平台数据看板
   */
  @Get('stats')
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  /**
   * GET /api/admin/users
   * 用户列表（分页 + 筛选）
   */
  @Get('users')
  async getUsers(@Query() query: QueryUsersDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 20;

    return this.adminService.getUsers({
      page,
      pageSize,
      search: query.search,
      role: query.role,
      status: query.status,
    });
  }

  /**
   * GET /api/admin/users/:id
   * 用户详情
   */
  @Get('users/:id')
  async getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  /**
   * PUT /api/admin/users/:id/role
   * 修改用户角色
   */
  @Put('users/:id/role')
  async updateUserRole(
    @CurrentUser('id') adminUserId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(
      adminUserId,
      targetUserId,
      dto.role,
      dto.password,
    );
  }

  /**
   * PUT /api/admin/users/:id/status
   * 修改用户状态
   */
  @Put('users/:id/status')
  async updateUserStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    // 防止管理员停用自己
    if (adminUserId === targetUserId) {
      throw new ForbiddenException('不能修改自己的状态');
    }

    return this.adminService.updateUserStatus(
      adminUserId,
      targetUserId,
      dto.status,
      dto.password,
    );
  }

  /**
   * GET /api/admin/transactions
   * 全平台交易监控
   */
  @Get('transactions')
  async getTransactions(@Query() query: QueryAdminTransactionsDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 20;

    return this.adminService.getTransactions({
      page,
      pageSize,
      search: query.search,
      type: query.type,
      userId: query.user_id,
      bookId: query.book_id,
      date_from: query.date_from,
      date_to: query.date_to,
    });
  }
}
