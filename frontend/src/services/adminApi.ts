import { request } from './api';

/** 平台统计数据 */
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersToday: number;
  totalBooks: number;
  totalTransactions: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  recentUsers: Array<{
    id: string;
    email: string;
    username: string;
    role: string;
    status: string;
    created_at: string;
  }>;
}

/** 获取平台统计数据 */
export const getAdminStats = async (): Promise<PlatformStats> => {
  return request('/admin/stats', { method: 'GET', requiresAuth: true });
};

/** 用户列表查询参数 */
export interface QueryUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

/** 用户列表响应 */
export interface UsersListResponse {
  users: Array<{
    id: string;
    email: string;
    username: string;
    role: string;
    status: string;
    created_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 获取用户列表 */
export const getAdminUsers = async (params: QueryUsersParams = {}): Promise<UsersListResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));
  if (params.search) query.append('search', params.search);
  if (params.role) query.append('role', params.role);
  if (params.status) query.append('status', params.status);

  const queryString = query.toString();
  return request(`/admin/users${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/** 用户详情 */
export interface UserDetail {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  stats: {
    transactionCount: number;
    bookCount: number;
    recentTransactions: Array<{
      id: number;
      amount: number;
      type: string;
      category: string;
      date: string;
      description: string;
      created_at: string;
    }>;
  };
}

/** 获取用户详情 */
export const getAdminUserDetail = async (userId: string): Promise<UserDetail> => {
  return request(`/admin/users/${userId}`, { method: 'GET', requiresAuth: true });
};

/** 修改用户角色 */
export const updateUserRole = async (
  userId: string,
  role: string,
  password: string,
): Promise<{ message: string }> => {
  return request(`/admin/users/${userId}/role`, {
    method: 'PUT',
    requiresAuth: true,
    body: { role, password },
  });
};

/** 修改用户状态 */
export const updateUserStatus = async (
  userId: string,
  status: string,
  password: string,
): Promise<{ message: string }> => {
  return request(`/admin/users/${userId}/status`, {
    method: 'PUT',
    requiresAuth: true,
    body: { status, password },
  });
};

/** 交易列表查询参数 */
export interface QueryAdminTransactionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  user_id?: string;
  book_id?: string;
  date_from?: string;
  date_to?: string;
}

/** 交易列表响应 */
export interface AdminTransactionsResponse {
  transactions: Array<{
    id: number;
    amount: number;
    type: string;
    date: string;
    description: string;
    created_at: string;
    users: {
      id: string;
      email: string;
      username: string;
    };
    categories: {
      id: string;
      name: string;
      icon: string;
      type: string;
    } | null;
    books: {
      id: string;
      name: string;
    } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 获取全平台交易列表 */
export const getAdminTransactions = async (
  params: QueryAdminTransactionsParams = {},
): Promise<AdminTransactionsResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);
  if (params.user_id) query.append('user_id', params.user_id);
  if (params.book_id) query.append('book_id', params.book_id);
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);

  const queryString = query.toString();
  return request(`/admin/transactions${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    requiresAuth: true,
  });
};
