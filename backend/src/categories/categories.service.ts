import {
  BadRequestException,
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
  user_id: string | null;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 查询所有可用分类（系统默认 + 用户自定义）
   */
  async findAll(userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能访问分类');
    }

    const supabase = this.supabaseService.getClient();

    // 查询系统默认分类（is_default=true） + 用户自定义分类
    let query = supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
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

  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    if (!userId) throw new ForbiddenException('需要登录才能创建分类');

    // 同时检查默认分类和用户自定义重名
    const supabase = this.supabaseService.getClient();
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .eq('name', dto.name)
      .eq('type', dto.type)
      .maybeSingle();

    if (existing) {
      throw new ConflictException(`"${dto.name}" 分类已存在`);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name: dto.name, icon: dto.icon, type: dto.type, is_default: false }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(`创建分类失败: ${error.message}`);
    return data;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<Category> {
    if (!userId) throw new ForbiddenException('需要登录才能更新分类');

    const existing = await this.findById(id, userId);
    if (existing.is_default) {
      throw new BadRequestException('系统默认分类不可修改');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.sort_order !== undefined) updateData.sort_order = dto.sort_order;

    if (Object.keys(updateData).length === 0) return existing;

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(`更新分类失败: ${error.message}`);
    return data;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!userId) throw new ForbiddenException('需要登录才能删除分类');

    const existing = await this.findById(id, userId);
    if (existing.is_default) {
      throw new BadRequestException('系统默认分类不可删除');
    }

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(`删除分类失败: ${error.message}`);
  }

  private async findById(id: string, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`id.eq.${id},id.eq.${id}`)
      .single();

    // 简单查询：直接查 id
    const { data: d, error: e } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (e || !d) throw new NotFoundException('分类不存在或无权访问');

    // 默认分类任何人可访问，自定义分类需验证所属权
    if (!d.is_default && d.user_id !== userId) {
      throw new NotFoundException('分类不存在或无权访问');
    }
    return d;
  }
}
