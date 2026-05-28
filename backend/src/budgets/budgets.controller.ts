import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { CopyBudgetDto } from './dto/copy-budget.dto';

@Controller('budgets')
@UseGuards(TokenAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /** 获取用户某月所有预算记录 */
  @Get()
  async getBudgets(
    @CurrentUser('id') userId: string,
    @Query('month') month: string,
  ) {
    return {
      message: '获取预算成功',
      data: await this.budgetsService.getBudgets(userId, month),
    };
  }

  /** 批量保存预算 */
  @Put()
  async upsertBudgets(
    @CurrentUser('id') userId: string,
    @Body() body: UpsertBudgetDto,
  ) {
    return {
      message: '保存预算成功',
      data: await this.budgetsService.upsertBudgets(userId, body),
    };
  }

  /** 获取预算执行状态 */
  @Get('status')
  async getBudgetStatus(
    @CurrentUser('id') userId: string,
    @Query('month') month: string,
  ) {
    return {
      message: '获取预算状态成功',
      data: await this.budgetsService.getStatus(userId, month),
    };
  }

  /** 复制上月预算到指定月份 */
  @Post('copy')
  async copyBudgets(
    @CurrentUser('id') userId: string,
    @Body() body: CopyBudgetDto,
  ) {
    return {
      message: '复制预算成功',
      data: await this.budgetsService.copyFromPrevious(userId, body.targetMonth),
    };
  }
}
