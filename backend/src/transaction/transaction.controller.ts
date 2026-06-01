import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { TransactionService, TransactionFilters } from './transaction.service';
import { BatchTransactionDto, BatchOperation } from './dto/batch-transaction.dto';

@Controller('transactions')
@UseGuards(TokenAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: 'amount' | 'date',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('keyword') keyword?: string,
    @Query('min_amount') min_amount?: string,
    @Query('max_amount') max_amount?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    const filters: TransactionFilters = {
      type,
      category,
      startDate,
      endDate,
      userId,
      bookId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      sortBy,
      sortOrder,
      search,
      keyword,
      min_amount,
      max_amount,
      date_from,
      date_to,
    };

    const data = await this.transactionService.findAll(filters);
    return { message: '获取交易记录成功', data };
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Param('id') id: string,
  ) {
    const data = await this.transactionService.findOne(+id, userId, bookId);
    return { message: '获取交易记录成功', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Body() transaction: any,
  ) {
    const data = await this.transactionService.create(transaction, userId, bookId);
    return { message: '创建交易记录成功', data };
  }

  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Param('id') id: string,
    @Body() transaction: any,
  ) {
    const data = await this.transactionService.update(+id, transaction, userId, bookId);
    return { message: '更新交易记录成功', data };
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async batch(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Body() dto: BatchTransactionDto,
  ) {
    // 手动触发 class-validator 校验（包括自定义校验器）
    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors
        .map((e) => Object.values(e.constraints || {}))
        .flat()
        .join('; ');
      throw new BadRequestException(messages);
    }

    const result = await this.transactionService.batch(userId, bookId, dto);
    return { message: '批量操作成功', data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @BookId() bookId: string | undefined,
    @Param('id') id: string,
  ) {
    await this.transactionService.remove(+id, userId, bookId);
    return { message: '删除交易记录成功', data: null };
  }
}
