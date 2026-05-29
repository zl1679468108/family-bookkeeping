import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { MapService } from './map.service';
import { MapTransactionsQueryDto, MerchantQueryDto } from './dto/map-query.dto';

@Controller('map')
@UseGuards(TokenAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('transactions')
  async getMapTransactions(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MapTransactionsQueryDto,
  ) {
    const data = await this.mapService.getTransactionsWithLocation(userId, bookId, query);
    return { message: '获取地图交易数据成功', data };
  }

  @Get('merchants')
  async getMerchantSummary(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query() query: MerchantQueryDto,
  ) {
    const data = await this.mapService.getMerchantSummary(userId, bookId, query);
    return { message: '获取商户消费汇总成功', data };
  }
}
