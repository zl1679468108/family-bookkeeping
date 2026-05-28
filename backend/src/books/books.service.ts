import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Book {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface BookMember {
  id: string;
  book_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

@Injectable()
export class BooksService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private getClient() {
    return this.supabaseService.getClient();
  }

  /** 创建账本 */
  async create(userId: string, name: string): Promise<Book> {
    const supabase = this.getClient();

    const { data: book, error } = await supabase
      .from('books')
      .insert({ name, owner_id: userId })
      .select()
      .single();

    if (error) {
      throw new ConflictException(`创建账本失败: ${error.message}`);
    }

    // 自动将创建者添加为 owner 成员
    await supabase.from('book_members').insert({
      book_id: book.id,
      user_id: userId,
      role: 'owner',
    });

    return book as Book;
  }

  /** 获取用户的账本列表 */
  async listByUser(userId: string): Promise<Book[]> {
    const supabase = this.getClient();

    // 查询用户作为成员的账本
    const { data: memberBooks, error: memberError } = await supabase
      .from('book_members')
      .select('book_id')
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`查询成员关系失败: ${memberError.message}`);
    }

    if (!memberBooks || memberBooks.length === 0) {
      return [];
    }

    const bookIds = memberBooks.map((m) => m.book_id);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .in('id', bookIds);

    if (error) {
      throw new Error(`查询账本失败: ${error.message}`);
    }

    return (data ?? []) as Book[];
  }

  /** 获取单个账本 */
  async getById(bookId: string): Promise<Book> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error || !data) {
      throw new NotFoundException('账本不存在');
    }

    return data as Book;
  }

  /** 重命名账本 */
  async rename(bookId: string, userId: string, name: string): Promise<Book> {
    await this.ensureOwner(bookId, userId);

    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('books')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      throw new Error(`重命名失败: ${error.message}`);
    }
    return data as Book;
  }

  /** 获取账本成员 */
  async getMembers(bookId: string) {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('book_members')
      .select('id, book_id, user_id, role, joined_at, users(email, username)')
      .eq('book_id', bookId);

    if (error) {
      throw new Error(`查询成员失败: ${error.message}`);
    }

    return (data ?? []).map((m: any) => ({
      id: m.id,
      bookId: m.book_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      email: m.users?.email,
      username: m.users?.username,
    }));
  }

  /** 邀请成员 — 仅验证邮箱对应的用户是否存在，不发送邮件 */
  async inviteMember(bookId: string, ownerId: string, email: string) {
    const supabase = this.getClient();

    // 验证 invitee 是 owner
    await this.ensureOwner(bookId, ownerId);

    // 查找被邀请用户
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !targetUser) {
      throw new NotFoundException('该用户不存在，请检查邮箱是否正确');
    }

    // 检查是否已是成员
    const { data: existing } = await supabase
      .from('book_members')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      throw new ConflictException('该用户已是账本成员');
    }

    // 添加成员
    const { error } = await supabase.from('book_members').insert({
      book_id: bookId,
      user_id: targetUser.id,
      role: 'member',
    });

    if (error) {
      throw new Error(`添加成员失败: ${error.message}`);
    }

    return { message: '添加成功' };
  }

  /** 删除账本 */
  async delete(bookId: string, userId: string) {
    await this.ensureOwner(bookId, userId);

    const supabase = this.getClient();
    const { error } = await supabase.from('books').delete().eq('id', bookId);

    if (error) {
      throw new Error(`删除账本失败: ${error.message}`);
    }

    return { message: '账本已删除' };
  }

  /** 退出账本 */
  async leave(bookId: string, userId: string) {
    const supabase = this.getClient();

    // 检查是否为 owner — owner 不能直接退出，必须先转让或删除
    const { data: membership } = await supabase
      .from('book_members')
      .select('role')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new NotFoundException('你不在该账本中');
    }

    if (membership.role === 'owner') {
      throw new ForbiddenException('账本所有者不能退出，请先转让所有权或删除账本');
    }

    const { error } = await supabase
      .from('book_members')
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`退出失败: ${error.message}`);
    }

    return { message: '已退出账本' };
  }

  /** 确认当前用户是账本 owner */
  private async ensureOwner(bookId: string, userId: string) {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('book_members')
      .select('role')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .single();

    if (!data || data.role !== 'owner') {
      throw new ForbiddenException('只有账本所有者才能执行此操作');
    }
  }
}
