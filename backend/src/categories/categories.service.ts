import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 查询用户的所有自定义分类
   * @param userId 当前用户 ID
   * @param type 可选，筛选类型（'income' | 'expense'）
   * @returns 分类列表，按 sort_order ASC + created_at ASC 排序
   */
  async findAll(userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能访问分类');
    }

    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(`获取分类列表失败: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * 创建自定义分类
   * @param dto 分类数据
   * @param userId 当前用户 ID
   * @returns 创建的分类
   */
  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能创建分类');
    }

    const supabase = this.supabaseService.getClient();

    // 检查 (user_id, name, type) 唯一约束
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', dto.name)
      .eq('type', dto.type)
      .maybeSingle();

    if (checkError) {
      throw new InternalServerErrorException(`分类校验失败: ${checkError.message}`);
    }

    if (existing) {
      throw new ConflictException(`"${dto.name}" 分类已存在`);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name: dto.name,
          icon: dto.icon,
          type: dto.type,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException(`"${dto.name}" 分类已存在`);
      }
      throw new InternalServerErrorException(`创建分类失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 更新自定义分类
   * @param id 分类 ID
   * @param dto 更新数据（仅更新 name/icon/sort_order）
   * @param userId 当前用户 ID
   * @returns 更新后的分类
   */
  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<Category> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能更新分类');
    }

    const supabase = this.supabaseService.getClient();

    // 验证分类存在且属于当前用户
    const existing = await this.findById(id, userId);

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.sort_order !== undefined) updateData.sort_order = dto.sort_order;

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`更新分类失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 删除自定义分类
   * @param id 分类 ID
   * @param userId 当前用户 ID
   */
  async remove(id: string, userId: string): Promise<void> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能删除分类');
    }

    // 验证分类存在且属于当前用户
    await this.findById(id, userId);

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(`删除分类失败: ${error.message}`);
    }
  }

  /**
   * 根据 ID 查找分类，验证所属权
   * @param id 分类 ID
   * @param userId 当前用户 ID
   * @returns 分类记录
   */
  private async findById(id: string, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('分类不存在或无权访问');
    }

    return data;
  }
}
