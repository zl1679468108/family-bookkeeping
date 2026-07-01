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
  user_id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  { name: '购物', icon: '🛒', type: 'expense', is_default: true, sort_order: 0 },
  { name: '工资', icon: '💼', type: 'income', is_default: true, sort_order: 0 },
] as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 查询用户所有分类（用户级默认 + 自定义）
   * 如果用户没有任何分类，自动创建 2 个默认分类
   */
  async findAll(userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
    if (!userId) {
      throw new ForbiddenException('需要登录才能访问分类');
    }

    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('jj_categories')
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

    // 如果用户没有任何分类，自动创建默认分类（兼容已有用户）
    if (!data || data.length === 0) {
      await this.createDefaultsForUser(userId);
      return this.findAll(userId, type);
    }

    return data;
  }

  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    if (!userId) throw new ForbiddenException('需要登录才能创建分类');

    const supabase = this.supabaseService.getClient();

    // 检查用户自己的分类中是否重名
    const { data: existing } = await supabase
      .from('jj_categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', dto.name)
      .eq('type', dto.type)
      .maybeSingle();

    if (existing) {
      throw new ConflictException(`"${dto.name}" 分类已存在`);
    }

    // 处理 icon_id：如果传的是 icon_id（自定义图标），需要转换为 URL
    let iconUrl = dto.icon || '📌';
    if (dto.icon_id) {
      const { data: customIcon, error: iconError } = await supabase
        .from('jj_custom_icons')
        .select('icon_url')
        .eq('id', dto.icon_id)
        .eq('user_id', userId)
        .single();

      if (iconError || !customIcon) {
        throw new BadRequestException('自定义图标不存在或无权访问');
      }
      iconUrl = customIcon.icon_url;
    }

    const { data, error } = await supabase
      .from('jj_categories')
      .insert([{ user_id: userId, name: dto.name, icon: iconUrl, type: dto.type, is_default: false }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(`创建分类失败: ${error.message}`);
    return data;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<Category> {
    if (!userId) throw new ForbiddenException('需要登录才能更新分类');

    const existing = await this.findById(id, userId);
    if (existing.is_default) {
      throw new BadRequestException('默认分类不可修改');
    }

    const supabase = this.supabaseService.getClient();
    let iconUrl = dto.icon;

    // 如果传的是 icon_id（自定义图标），需要转换为图标 URL
    if (dto.icon_id) {
      const { data: customIcon, error: iconError } = await supabase
        .from('jj_custom_icons')
        .select('icon_url')
        .eq('id', dto.icon_id)
        .eq('user_id', userId)
        .single();

      if (iconError || !customIcon) {
        throw new BadRequestException('自定义图标不存在或无权访问');
      }
      iconUrl = customIcon.icon_url;
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (iconUrl !== undefined) updateData.icon = iconUrl;
    if (dto.sort_order !== undefined) updateData.sort_order = dto.sort_order;

    if (Object.keys(updateData).length === 0) return existing;

    const { data, error } = await supabase
      .from('jj_categories')
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
      throw new BadRequestException('默认分类不可删除');
    }

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('jj_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(`删除分类失败: ${error.message}`);
  }

  /**
   * 批量更新分类排序（仅更新用户自己的分类）
   */
  async reorder(orders: { id: string; sort_order: number }[], userId: string): Promise<void> {
    if (!userId) throw new ForbiddenException('需要登录才能修改排序');
    if (!orders || orders.length === 0) throw new BadRequestException('排序列表不能为空');

    const supabase = this.supabaseService.getClient();

    // T-H1: 使用单次批量更新替代 N+1 请求
    const ids = orders.map((o) => o.id);
    const { error } = await supabase
      .from('jj_categories')
      .upsert(
        orders.map((o) => ({ id: o.id, sort_order: o.sort_order, user_id: userId })),
        { onConflict: 'id' },
      )
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(`更新排序失败: ${error.message}`);
    }
  }

  /** 为已有用户创建默认分类（幂等：仅在用户无分类时调用） */
  async createDefaultsForUser(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 先检查是否已有分类，避免重复创建
    const { count } = await supabase
      .from('jj_categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count > 0) return;

    const defaults = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      user_id: userId,
    }));

    await supabase.from('jj_categories').insert(defaults);
  }

  private async findById(id: string, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('jj_categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('分类不存在或无权访问');
    return data;
  }
}
