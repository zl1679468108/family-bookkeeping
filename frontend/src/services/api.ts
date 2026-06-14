/**
 * API 服务 - 调用后端 NestJS API
 * 前缀: /api
 */

import { notify } from '../utils/notifications'
import { trackRequest } from '../utils/progress'
import type { BatchRequest, BatchResponse } from '../types/batch'

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'auth_token'

export interface Transaction {
  id: number
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  time?: string
  description?: string
  brand?: string
  image_url?: string
  image_urls?: string
  image_url_list?: string[]
  location_name?: string
  latitude?: number
  longitude?: number
  poi_id?: string | null
  created_at: string
}

export interface TransactionFilters {
  type?: 'income' | 'expense'
  category?: string
  startDate?: string
  endDate?: string
  /** 查看范围：'own' 只看自己，'all' 查看账本内所有（需是 Owner） */
  view?: 'own' | 'all'
  bookId?: string
  page?: number
  pageSize?: number
  sortBy?: 'amount' | 'date'
  sortOrder?: 'asc' | 'desc'
  search?: string
  keyword?: string
  min_amount?: number
  max_amount?: number
  date_from?: string
  date_to?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url?: string
  role?: 'user' | 'admin'
  status?: 'active' | 'suspended' | 'deleted'
  created_at: string
}

interface ApiEnvelope<T> {
  success: true
  message: string
  data: T
}

interface ApiErrorPayload {
  success?: false
  message?: string
  statusCode?: number
  code?: string
}

export class ApiError extends Error {
  statusCode: number
  code?: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  requiresAuth?: boolean
  responseType?: 'json' | 'blob'
  notifyOnError?: boolean
  /**
   * 是否显示顶部进度条。
   * 未显式指定时：POST/PUT/DELETE/PATCH 写操作默认显示（按钮点击等显式交互），
   * GET/HEAD 等读操作默认不显示（页面初始化类加载走骨架屏即可）。
   */
  showProgress?: boolean
}

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const hasToken = (): boolean => Boolean(getToken())

export const storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

const redirectToLogin = (): void => {
  if (window.location.hash.startsWith('#/login')) {
    return
  }

  const currentPath = `${window.location.hash.replace(/^#/, '') || '/'}`
  const redirect = encodeURIComponent(currentPath)
  window.location.hash = `/login?redirect=${redirect}`
}

const handleUnauthorized = (notifyOnError: boolean): void => {
  clearStoredToken()
  if (notifyOnError) {
    notify({
      type: 'error',
      message: '登录状态已失效，请重新登录',
    })
  }
  redirectToLogin()
}

const parseErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
  try {
    return (await response.json()) as ApiErrorPayload
  } catch {
    return {}
  }
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    body,
    requiresAuth = false,
    responseType = 'json',
    notifyOnError = true,
    showProgress,
    headers,
    method,
    ...rest
  } = options

  // 写操作（POST/PUT/DELETE/PATCH）默认显示进度条，读操作默认不显示
  const effectiveMethod = (method ?? 'GET').toUpperCase()
  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(effectiveMethod)
  const shouldShowProgress = showProgress ?? isWrite

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${path}`
  if (shouldShowProgress) {
    trackRequest(requestId, 'start')
  }

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string> || {}),
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (!isFormData && body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (requiresAuth) {
    const token = getToken()
    if (!token) {
      // token 不存在，直接跳转登录
      if (shouldShowProgress) {
        trackRequest(requestId, 'end')
      }
      handleUnauthorized(notifyOnError)
      throw new ApiError('登录状态已失效，请重新登录', 401)
    }
    const trimmedToken = token.trim()
    requestHeaders.Authorization = `Bearer ${trimmedToken}`
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      method: effectiveMethod,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    })

    if (!response.ok) {
      const errorPayload = await parseErrorPayload(response)
      const error = new ApiError(
        errorPayload.message || '请求失败',
        errorPayload.statusCode || response.status,
        errorPayload.code,
      )

      if (requiresAuth && response.status === 401) {
        handleUnauthorized(notifyOnError)
      } else if (notifyOnError) {
        notify({ type: 'error', message: error.message })
      }

      throw error
    }

    if (responseType === 'blob') {
      return await response.blob() as T
    }

    const payload = await response.json() as ApiEnvelope<T>
    return payload.data
  } catch (err) {
    // 网络层错误（如断网、DNS 失败）也通知用户
    if (notifyOnError && !(err instanceof ApiError)) {
      const message = err instanceof Error ? err.message : '请求失败'
      notify({ type: 'error', message })
    }
    throw err
  } finally {
    if (shouldShowProgress) {
      trackRequest(requestId, 'end')
    }
  }
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

export const getTransactions = async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.view) params.append('view', filters.view)
  if (filters?.bookId) params.append('bookId', filters.bookId)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize))
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.keyword) params.append('keyword', filters.keyword)
  if (filters?.min_amount !== undefined) params.append('min_amount', String(filters.min_amount))
  if (filters?.max_amount !== undefined) params.append('max_amount', String(filters.max_amount))
  if (filters?.date_from) params.append('date_from', filters.date_from)
  if (filters?.date_to) params.append('date_to', filters.date_to)

  const query = params.toString() ? `?${params.toString()}` : ''
  return request<PaginatedResponse<Transaction>>(`/transactions${query}`, { requiresAuth: true })
}

export const getTransaction = async (id: number): Promise<Transaction> => {
  return request<Transaction>(`/transactions/${id}`, { requiresAuth: true })
}

export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  return request<Transaction>('/transactions', {
    method: 'POST',
    requiresAuth: true,
    body: transaction,
  })
}

export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  return request<Transaction>(`/transactions/${id}`, {
    method: 'PUT',
    requiresAuth: true,
    body: transaction,
  })
}

export const deleteTransaction = async (id: number): Promise<void> => {
  await request<null>(`/transactions/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export const exportToExcel = async (filters?: TransactionFilters): Promise<void> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const query = params.toString() ? `?${params.toString()}` : ''
  const blob = await request<Blob>(`/export/excel${query}`, {
    requiresAuth: true,
    responseType: 'blob',
    showProgress: true,
  })

  downloadBlob(blob, `transactions_${Date.now()}.xlsx`)
}

export const exportToPDF = async (filters?: TransactionFilters): Promise<void> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const query = params.toString() ? `?${params.toString()}` : ''
  const blob = await request<Blob>(`/export/pdf${query}`, {
    requiresAuth: true,
    responseType: 'blob',
    showProgress: true,
  })

  downloadBlob(blob, `transactions_${Date.now()}.pdf`)
}

/**
 * 批量操作交易 - P1-2
 * POST /api/transactions/batch
 */
export const batchTransactions = async (data: BatchRequest): Promise<BatchResponse> => {
  return request<BatchResponse>('/transactions/batch', {
    method: 'POST',
    requiresAuth: true,
    body: data,
  })
}

/**
 * 上传收据图片 - P2-1
 * POST /api/transactions/:id/receipt
 */
export const uploadReceipt = async (transactionId: number, file: Blob): Promise<{ image_url: string }> => {
  const formData = new FormData();
  formData.append('file', file, 'receipt.jpg');
  return request<{ image_url: string }>(`/transactions/${transactionId}/receipt`, {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
}

/**
 * 删除收据图片 - P2-1
 * DELETE /api/transactions/:id/receipt
 */
export const deleteReceipt = async (transactionId: number): Promise<void> => {
  await request<null>(`/transactions/${transactionId}/receipt`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export const register = async (
  email: string,
  password: string,
  username: string,
): Promise<{ user: UserProfile; token: string }> => {
  return request<{ user: UserProfile; token: string }>('/auth/register', {
    method: 'POST',
    body: { email, password, username },
  })
}

export const login = async (
  email: string,
  password: string,
): Promise<{ user: UserProfile; token: string }> => {
  // 获取当前存储的 token（如果有），传递给后端用于复用
  const currentToken = getToken()
  return request<{ user: UserProfile; token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password, token: currentToken || undefined },
  })
}

export const forgotPassword = async (email: string): Promise<void> => {
  await request<null>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export const sendResetCode = async (email: string): Promise<void> => {
  await request<null>('/auth/send-reset-code', {
    method: 'POST',
    body: { email },
  })
}

export const resetPasswordByCode = async (
  email: string,
  code: string,
  password: string,
  confirmPassword: string,
): Promise<void> => {
  await request<null>('/auth/reset-password-by-code', {
    method: 'POST',
    body: { email, code, password, confirmPassword },
  })
}

export const getProfile = async (): Promise<UserProfile> => {
  return request<UserProfile>('/auth/profile', { requiresAuth: true })
}

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  return request<UserProfile>('/auth/profile', {
    method: 'PUT',
    body: data,
    requiresAuth: true,
  })
}

export const logout = async (): Promise<void> => {
  await request<null>('/auth/logout', {
    method: 'POST',
    requiresAuth: true,
    notifyOnError: false,
  })
}

export const changePassword = async (
  data: { oldPassword: string; newPassword: string; confirmPassword: string }
): Promise<void> => {
  return request<void>('/auth/change-password', {
    method: 'POST',
    body: data,
    requiresAuth: true,
  });
}

export const getCurrentUser = async (): Promise<UserProfile & { current_book_id?: string }> => {
  return request<UserProfile & { current_book_id?: string }>('/auth/profile', {
    requiresAuth: true,
  });
}

export const setCurrentBook = async (bookId: string): Promise<{ book_id: string }> => {
  return request<{ book_id: string }>('/auth/current-book', {
    method: 'PUT',
    body: { book_id: bookId },
    requiresAuth: true,
  });
}

export const apiClient = {
  post: async (url: string, data: unknown): Promise<unknown> => {
    return request(url, { method: 'POST', body: data })
  },
  get: async (url: string): Promise<unknown> => {
    return request(url, { requiresAuth: true })
  },
  put: async (url: string, data: unknown): Promise<unknown> => {
    return request(url, { method: 'PUT', requiresAuth: true, body: data })
  },
  delete: async (url: string): Promise<unknown> => {
    return request(url, { method: 'DELETE', requiresAuth: true })
  },
}
