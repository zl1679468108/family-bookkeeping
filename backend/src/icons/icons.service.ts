import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CustomIcon {
  id: string;
  user_id: string;
  icon_url: string;
  icon_type: 'category' | 'book';
  created_at: string;
}

@Injectable()
export class IconsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 获取用户自定义图标列表
   */
  async findAll(
    userId: string,
    iconType?: 'category' | 'book',
  ): Promise<CustomIcon[]> {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('jj_custom_icons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (iconType) {
      query = query.eq('icon_type', iconType);
    }

    const { data, error } = await query;
    if (error) {
      throw new InternalServerErrorException(
        `获取图标列表失败: ${error.message}`,
      );
    }
    return data || [];
  }

  /**
   * 上传图标图片到 Supabase Storage 并保存记录
   */
  async upload(
    userId: string,
    iconType: 'category' | 'book',
    file: Express.Multer.File,
  ): Promise<CustomIcon> {
    const supabase = this.supabaseService.getClient();

    // 生成路径: icons/{userId}/{uuid}.{ext}
    const ext = file.originalname.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `icons/${userId}/${filename}`;

    // 上传到 Supabase Storage
    const { error } = await supabase.storage
      .from('icons')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
      });

    if (error) {
      throw new InternalServerErrorException('图标上传失败: ' + error.message);
    }

    // 获取 public URL
    const { data: urlData } = supabase.storage
      .from('icons')
      .getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // 保存记录到数据库
    const { data, error: dbError } = await supabase
      .from('jj_custom_icons')
      .insert([{ user_id: userId, icon_url: publicUrl, icon_type: iconType }])
      .select()
      .single();

    if (dbError) {
      throw new InternalServerErrorException(
        `保存图标记录失败: ${dbError.message}`,
      );
    }

    return data;
  }

  /**
   * 删除图标（同时删除 Storage 中的文件和数据库记录）
   */
  async remove(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 先查询记录以获取文件路径
    const { data, error } = await supabase
      .from('jj_custom_icons')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('图标不存在或无权访问');
    }

    // 从 Storage 删除文件
    const urlParts = data.icon_url.split('/icons/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('icons').remove([filePath]);
    }

    // 删除数据库记录
    const { error: deleteError } = await supabase
      .from('jj_custom_icons')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw new InternalServerErrorException(
        `删除图标失败: ${deleteError.message}`,
      );
    }
  }
}
