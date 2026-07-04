import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@Controller('categories')
@UseGuards(TokenAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: 'income' | 'expense',
  ) {
    const data = await this.categoriesService.findAll(userId, type);
    return { message: '获取分类列表成功', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.create(dto, userId);
    return { message: '创建分类成功', data };
  }

  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(id, dto, userId);
    return { message: '更新分类成功', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.categoriesService.remove(id, userId);
    return { message: '删除分类成功', data: null };
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    await this.categoriesService.reorder(dto.orders, userId);
    return { message: '排序更新成功', data: null };
  }
}
