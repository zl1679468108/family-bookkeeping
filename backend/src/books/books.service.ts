import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { randomInt } from 'crypto';

export interface Book {
  id: string;
  name: string;
  owner_id: string;
  is_archived?: boolean;
  icon?: string;
  description?: string;
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

  /** 生成 6 位大写字母+数字邀请码（排除易混淆字符） */
  private randomCode(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += alphabet.charAt(randomInt(alphabet.length));
    }
    return result;
  }

  /** 创建账本 */
  async create(userId: string, name: string, description?: string, icon?: string, iconId?: string): Promise<Book> {
    const supabase = this.getClient();

    // 处理 icon_id：如果传的是 iconId（自定义图标），需要转换为 URL
    let iconUrl = icon || 'default';
    if (iconId) {
      const { data: customIcon, error: iconError } = await supabase
        .from('jj_custom_icons')
        .select('icon_url')
        .eq('id', iconId)
        .eq('user_id', userId)
        .single();

      if (iconError || !customIcon) {
        throw new BadRequestException('自定义图标不存在或无权访问');
      }
      iconUrl = customIcon.icon_url;
    }

    const { data: book, error } = await supabase
      .from('jj_books')
      .insert({ name, owner_id: userId, description, icon: iconUrl })
      .select()
      .single();

    if (error) {
      throw new ConflictException(`创建账本失败：${error.message}`);
    }

    // 自动将创建者添加为 owner 成员
    await supabase.from('jj_book_members').insert({
      book_id: book.id,
      user_id: userId,
      role: 'owner',
    });

    return book as Book;
  }

  /** 获取用户的账本列表（包含当前用户在账本中的角色和交易笔数） */
  async listByUser(userId: string): Promise<(Book & { role: string; txn_count?: number })[]> {
    const supabase = this.getClient();

    // 查询用户作为成员的账本，同时获取角色
    const { data: memberBooks, error: memberError } = await supabase
      .from('jj_book_members')
      .select('book_id, role')
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`查询成员关系失败：${memberError.message}`);
    }

    if (!memberBooks || memberBooks.length === 0) {
      return [];
    }

    const bookIds = memberBooks.map((m) => m.book_id);
    const { data, error } = await supabase
      .from('jj_books')
      .select('*')
      .in('id', bookIds)
      .order('is_archived', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`查询账本失败：${error.message}`);
    }

    // 批量统计所有账本的交易笔数（单次查询）
    const { data: txnCounts, error: txnError } = await supabase
      .from('jj_transactions')
      .select('book_id')
      .in('book_id', bookIds);

    const txnCountMap = new Map<string, number>();
    for (const bookId of bookIds) {
      txnCountMap.set(bookId, 0);
    }
    if (!txnError && txnCounts) {
      for (const row of txnCounts) {
        txnCountMap.set(row.book_id, (txnCountMap.get(row.book_id) || 0) + 1);
      }
    }

    // 将 role 和 txn_count 信息合并到账本数据中
    const roleMap = new Map(memberBooks.map((m) => [m.book_id, m.role]));
    const booksWithRole = (data ?? []).map((book: any) => ({
      ...book,
      role: roleMap.get(book.id) || 'member',
      txn_count: txnCountMap.get(book.id) || 0,
    }));

    return booksWithRole as (Book & { role: string; txn_count?: number })[];
  }

  /** 获取单个账本 */
  async getById(bookId: string): Promise<Book> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('jj_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      throw new NotFoundException(`账本不存在：${bookId}`);
    }

    return data as Book;
  }

  /** 检查用户是否为账本 Owner */
  async checkOwner(bookId: string, userId: string): Promise<{ isOwner: boolean }> {
    const book = await this.getById(bookId);
    return { isOwner: book.owner_id === userId };
  }

  /** 更新账本 */
  async update(bookId: string, userId: string, name: string, description?: string, icon?: string, iconId?: string): Promise<Book> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以修改账本信息');
    }

    const supabase = this.getClient();
    let iconUrl = icon;

    // 如果传的是 iconId（自定义图标），需要转换为图标 URL
    if (iconId) {
      const { data: customIcon, error: iconError } = await supabase
        .from('jj_custom_icons')
        .select('icon_url')
        .eq('id', iconId)
        .eq('user_id', userId)
        .single();

      if (iconError || !customIcon) {
        throw new BadRequestException('自定义图标不存在或无权访问');
      }
      iconUrl = customIcon.icon_url;
    }

    const { data, error } = await supabase
      .from('jj_books')
      .update({ name, description, icon: iconUrl, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      throw new ConflictException(`更新账本失败：${error.message}`);
    }

    return data as Book;
  }

  /** 删除账本 */
  async delete(bookId: string, userId: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以删除账本');
    }

    const supabase = this.getClient();

    // 先删除关联的账本成员记录
    const { error: memberError } = await supabase
      .from('jj_book_members')
      .delete()
      .eq('book_id', bookId);

    if (memberError) {
      throw new ConflictException(`删除账本成员失败：${memberError.message}`);
    }

    // 再删除账本本身
    const { error } = await supabase
      .from('jj_books')
      .delete()
      .eq('id', bookId);

    if (error) {
      throw new ConflictException(`删除账本失败：${error.message}`);
    }
  }

  /** 获取账本成员 */
  async getMembers(bookId: string): Promise<any[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('jj_book_members')
      .select('id, book_id, user_id, role, joined_at, jj_users(id, email, username)')
      .eq('book_id', bookId);

    if (error) {
      throw new Error(`查询成员失败：${error.message}`);
    }

    return (data ?? []).map((m: any) => ({
      ...m,
      email: m.users?.email,
      username: m.users?.username,
    }));
  }

  /** 邀请成员 */
  async inviteMember(bookId: string, userId: string, email: string): Promise<any> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以邀请成员');
    }

    const supabase = this.getClient();

    // 查询用户
    const { data: user } = await supabase
      .from('jj_users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new NotFoundException(`用户不存在：${email}`);
    }

    // 检查是否已经是成员
    const { data: existing } = await supabase
      .from('jj_book_members')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw new ConflictException('该用户已经是成员');
    }

    // 添加成员
    const { data: member, error } = await supabase
      .from('jj_book_members')
      .insert({
        book_id: bookId,
        user_id: user.id,
        role: 'member',
      })
      .select()
      .single();

    if (error) {
      throw new ConflictException(`添加成员失败：${error.message}`);
    }

    return member;
  }

  /** 移除成员 */
  async removeMember(bookId: string, ownerId: string, userId: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id !== ownerId) {
      throw new ForbiddenException('只有账主可以移除成员');
    }

    if (book.owner_id === userId) {
      throw new ForbiddenException('不能移除账主');
    }

    const supabase = this.getClient();
    const { error } = await supabase
      .from('jj_book_members')
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', userId);

    if (error) {
      throw new ConflictException(`移除成员失败：${error.message}`);
    }
  }

  /** 退出账本 */
  async leave(bookId: string, userId: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id === userId) {
      throw new ForbiddenException('账主不能退出账本');
    }

    const supabase = this.getClient();
    const { error } = await supabase
      .from('jj_book_members')
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', userId);

    if (error) {
      throw new ConflictException(`退出账本失败：${error.message}`);
    }
  }

  /** 转让账主 */
  async transferOwner(bookId: string, currentOwnerId: string, newOwnerEmail: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id !== currentOwnerId) {
      throw new ForbiddenException('只有账主可以转让所有权');
    }

    const supabase = this.getClient();

    // 查询新账主
    const { data: newOwner } = await supabase
      .from('jj_users')
      .select('id')
      .eq('email', newOwnerEmail)
      .single();

    if (!newOwner) {
      throw new NotFoundException(`用户不存在：${newOwnerEmail}`);
    }

    // 更新账主
    const { error: updateError } = await supabase
      .from('jj_books')
      .update({ owner_id: newOwner.id, updated_at: new Date().toISOString() })
      .eq('id', bookId);

    if (updateError) {
      throw new ConflictException(`转让失败：${updateError.message}`);
    }

    // 确保新 owner 是账本成员（B-H2）
    await supabase.from('jj_book_members').upsert({
      book_id: bookId,
      user_id: newOwner.id,
      role: 'owner',
    }, { onConflict: 'book_id,user_id' });

    // 更新原账主为普通成员
    await supabase
      .from('jj_book_members')
      .update({ role: 'member' })
      .eq('book_id', bookId)
      .eq('user_id', currentOwnerId);
  }

  /** 归档账本 */
  async archiveBook(bookId: string, userId: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以归档账本');
    }

    const supabase = this.getClient();
    const { error } = await supabase
      .from('jj_books')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', bookId);

    if (error) {
      throw new ConflictException(`归档失败：${error.message}`);
    }
  }

  /** 取消归档 */
  async unarchiveBook(bookId: string, userId: string): Promise<void> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以取消归档');
    }

    const supabase = this.getClient();
    const { error } = await supabase
      .from('jj_books')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', bookId);

    if (error) {
      throw new ConflictException(`取消归档失败：${error.message}`);
    }
  }

  /** 生成邀请码（有效期内复用已有邀请码，过期或不存在时生成新码） */
  async generateInvitationCode(bookId: string, userId: string): Promise<{ code: string; book_name: string; expires_at: string }> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以生成邀请码');
    }

    const supabase = this.getClient();
    const now = new Date().toISOString();

    // 1. 查找该账本是否已有未过期、未使用的邀请码，有则直接返回
    const { data: existing } = await supabase
      .from('jj_book_invitations')
      .select('code, expires_at')
      .eq('book_id', bookId)
      .gt('expires_at', now)
      .is('used_at', null)
      .limit(1)
      .single();

    if (existing) {
      return { code: existing.code, book_name: book.name, expires_at: existing.expires_at };
    }

    // 2. 没有可用邀请码，生成新码（7 天有效期）
    const code = this.randomCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('jj_book_invitations')
      .insert({
        book_id: bookId,
        code,
        created_by: userId,
        expires_at: expiresAt,
      })
      .select('code, expires_at')
      .single();

    if (error) {
      throw new ConflictException(`生成邀请码失败：${error.message}`);
    }

    return { code: data.code, book_name: book.name, expires_at: data.expires_at };
  }

  /** 查询邀请码是否有效 */
  async getInvitationByCode(code: string): Promise<{ book_id: string; book_name: string; expires_at: string } | null> {
    const supabase = this.getClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('jj_book_invitations')
      .select('book_id, expires_at, used_at')
      .eq('code', code)
      .gt('expires_at', now)
      .is('used_at', null)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // 获取账本名称
    const book = await this.getById(data.book_id);

    return {
      book_id: data.book_id,
      book_name: book.name,
      expires_at: data.expires_at,
    };
  }

  /** 使用邀请码加入账本（B-H3: 使用原子更新防止邀请码并发使用） */
  async joinByInvitationCode(code: string, userId: string): Promise<{ book_id: string; book_name: string }> {
    const supabase = this.getClient();
    const now = new Date().toISOString();

    // 1. 查找有效邀请码
    const { data: invitation, error: inviteError } = await supabase
      .from('jj_book_invitations')
      .select('id, book_id, expires_at, used_at, created_by')
      .eq('code', code)
      .gt('expires_at', now)
      .is('used_at', null)
      .limit(1)
      .single();

    if (inviteError || !invitation) {
      throw new NotFoundException('邀请码无效或已过期');
    }

    // 2. 不能使用自己创建的邀请码
    if (invitation.created_by === userId) {
      throw new ConflictException('不能使用自己生成的邀请码加入账本');
    }

    // 3. 检查用户是否已经是成员
    const { data: existingMember } = await supabase
      .from('jj_book_members')
      .select('role')
      .eq('book_id', invitation.book_id)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (existingMember) {
      const msg =
        existingMember.role === 'owner'
          ? '你已是该账主，无需加入'
          : '你已是该账本成员，无需重复加入';
      throw new ConflictException(msg);
    }

    // 4. 原子化：先标记邀请码为已使用（B-H3 防止并发使用同一邀请码）
    //    WHERE used_at IS NULL 确保只有一个请求能成功
    const { data: updateResult, error: updateError } = await supabase
      .from('jj_book_invitations')
      .update({ used_by: userId, used_at: now })
      .eq('id', invitation.id)
      .is('used_at', null)
      .select()
      .single();

    if (updateError) {
      throw new ConflictException(`邀请码标记失败：${updateError.message}`);
    }

    // 如果 updateResult 为 null，说明邀请码已被其他人使用（并发竞争）
    if (!updateResult) {
      throw new ConflictException('邀请码已被使用，请重新获取');
    }

    // 5. 添加为成员
    const { error: memberError } = await supabase
      .from('jj_book_members')
      .insert({
        book_id: invitation.book_id,
        user_id: userId,
        role: 'member',
      });

    if (memberError) {
      throw new ConflictException(`加入账本失败：${memberError.message}`);
    }

    const book = await this.getById(invitation.book_id);
    return { book_id: book.id, book_name: book.name };
  }

  /** 更新账本描述 */
  async updateDescription(bookId: string, userId: string, description: string): Promise<Book> {
    const book = await this.getById(bookId);
    if (book.owner_id !== userId) {
      throw new ForbiddenException('只有账主可以修改描述');
    }

    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('jj_books')
      .update({ description, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      throw new ConflictException(`更新描述失败：${error.message}`);
    }

    return data as Book;
  }
}
