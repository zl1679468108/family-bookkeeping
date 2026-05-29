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
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookId } from '../books/book-id.decorator';
import { TransactionService, TransactionFilters } from './transaction.service';

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
