import { Controller, Get, Post, Query, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { MapService } from './map.service';
import { MapTransactionsQueryDto, MerchantQueryDto, MerchantTransactionsQueryDto } from './dto/map-query.dto';
import { UpdateLocationDto } from './dto/location.dto';

@Controller('map')
@UseGuards(TokenAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  /**
   * GET /map/transactions
   * P1 扩展：支持 memberIds 查询参数（逗号分隔），
   * 为空时行为与 P0 完全一致（仅查询当前用户）。
   */
  @Get('transactions')
  async getMapTransactions(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MapTransactionsQueryDto,
  ) {
    const memberIds = this.parseMemberIds(query.memberIds);
    const data = await this.mapService.getTransactionsWithLocation(userId, bookId, query, memberIds);
    return { message: '获取地图交易数据成功', data };
  }

  /**
   * GET /map/merchants
   * P1 扩展：支持 memberIds 查询参数，
   * 多成员模式下返回 member_breakdown 字段。
   */
  @Get('merchants')
  async getMerchantSummary(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MerchantQueryDto,
  ) {
    const memberIds = this.parseMemberIds(query.memberIds);
    const data = await this.mapService.getMerchantSummary(userId, bookId, query, memberIds);
    return { message: '获取商户消费汇总成功', data };
  }

  /**
   * GET /map/merchants/transactions
   * P1 不需要大改，保持兼容。
   */
  @Get('merchants/transactions')
  async getMerchantTransactions(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MerchantTransactionsQueryDto,
  ) {
    const data = await this.mapService.getMerchantTransactions(userId, bookId, query);
    return { message: '获取商户交易记录成功', data };
  }

  /**
   * P1 新增：GET /map/members
   * 获取账本成员列表（含固定颜色分配）。
   */
  @Get('members')
  async getMembers(
    @BookId() bookId: string | undefined,
  ) {
    if (!bookId) {
      throw new BadRequestException('缺少账本 ID（x-book-id header）');
    }
    const data = await this.mapService.getBookMembers(bookId);
    return { message: '获取成员列表成功', data };
  }

  /**
   * P1 新增：POST /map/location
   * 上报当前用户位置 + 共享开关。
   */
  @Post('location')
  async updateMyLocation(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Body() dto: UpdateLocationDto,
  ) {
    const data = await this.mapService.upsertMemberLocation(userId, bookId, dto);
    return { message: '位置更新成功', data };
  }

  /**
   * P1 新增：GET /map/members/locations
   * 获取账本内所有开启位置共享的成员位置。
   */
  @Get('members/locations')
  async getMemberLocations(
    @BookId() bookId: string | undefined,
  ) {
    const data = await this.mapService.getSharingMemberLocations(bookId);
    return { message: '获取成员位置成功', data };
  }

  /**
   * 将逗号分隔的 memberIds 字符串解析为 string[]。
   * 若为空或解析后无有效值，返回 undefined（Service 层会回退到 P0 单用户逻辑）。
   */
  private parseMemberIds(raw?: string): string[] | undefined {
    if (!raw) return undefined;
    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return ids.length > 0 ? ids : undefined;
  }
}
