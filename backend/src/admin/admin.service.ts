import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 平台数据看板统计
   */
  async getPlatformStats() {
    const supabase = this.supabaseService.getClient();

    // 并行查询各项统计
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: adminUsers },
      { count: totalBooks },
      { count: totalTransactions },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('id, email, username, role, status, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    // 获取今日新增用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 获取本月交易总额
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: monthTransactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('created_at', firstDayOfMonth);

    const monthIncome = monthTransactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const monthExpense = monthTransactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      adminUsers: adminUsers || 0,
      newUsersToday: newUsersToday || 0,
      totalBooks: totalBooks || 0,
      totalTransactions: totalTransactions || 0,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      recentUsers: recentUsers || [],
    };
  }

  /**
   * 查询用户列表（分页 + 筛选）
   */
  async getUsers(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const supabase = this.supabaseService.getClient();
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('users')
      .select('id, email, username, role, status, created_at', { count: 'exact' });

    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`查询用户列表失败: ${error.message}`);
    }

    return {
      users: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 获取用户详情（含统计）
   */
  async getUserDetail(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, status, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('用户不存在');
    }

    // 获取用户的统计数据
    const [
      { count: transactionCount },
      { count: bookCount },
      { data: recentTransactions },
    ] = await Promise.all([
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('book_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('transactions')
        .select('id, amount, type, category, date, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return {
      ...user,
      stats: {
        transactionCount: transactionCount || 0,
        bookCount: bookCount || 0,
        recentTransactions: recentTransactions || [],
      },
    };
  }

  /**
   * 修改用户角色（需要管理员密码确认）
   */
  async updateUserRole(adminUserId: string, targetUserId: string, newRole: string, password: string) {
    // 验证管理员密码
    const isPasswordValid = await this.authService.validatePassword(adminUserId, password);
    if (!isPasswordValid) {
      throw new ForbiddenException('管理员密码错误');
    }

    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (error) {
      throw new Error(`修改用户角色失败: ${error.message}`);
    }

    return { message: `用户角色已更新为 ${newRole}` };
  }

  /**
   * 修改用户状态（需要管理员密码确认）
   */
  async updateUserStatus(adminUserId: string, targetUserId: string, newStatus: string, password: string) {
    // 验证管理员密码
    const isPasswordValid = await this.authService.validatePassword(adminUserId, password);
    if (!isPasswordValid) {
      throw new ForbiddenException('管理员密码错误');
    }

    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (error) {
      throw new Error(`修改用户状态失败: ${error.message}`);
    }

    return { message: `用户状态已更新为 ${newStatus}` };
  }

  /**
   * 查询全平台交易列表（监控用）
   */
  async getTransactions(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    userId?: string;
    bookId?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const supabase = this.supabaseService.getClient();
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('transactions')
      .select(
        `
        id, amount, type, date, description, created_at,
        users (id, email, username),
        categories (id, name, icon, type),
        books (id, name)
      `,
        { count: 'exact' },
      );

    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.bookId) {
      query = query.eq('book_id', filters.bookId);
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`查询交易列表失败: ${error.message}`);
    }

    return {
      transactions: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}
