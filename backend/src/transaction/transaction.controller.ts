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
} from '@nestjs/common';
import { TransactionService, TransactionFilters } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async findAll(
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: TransactionFilters = {
      type,
      category,
      startDate,
      endDate,
    };

    return await this.transactionService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.transactionService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() transaction: any) {
    return await this.transactionService.create(transaction);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() transaction: any) {
    return await this.transactionService.update(+id, transaction);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.transactionService.remove(+id);
  }
}
