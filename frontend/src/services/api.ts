/**
 * API 服务 - 调用后端 NestJS API
 * 前缀: /api
 */

import { notify } from '../utils/notifications'

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api'
const AUTH_TOKEN_KEY = 'auth_token'

export interface Transaction {
  id: number
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  description?: string
  image_url?: string
  created_at: string
}

export interface TransactionFilters {
  type?: 'income' | 'expense'
  category?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: 'amount' | 'date'
  sortOrder?: 'asc' | 'desc'
  search?: string
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
}

const getToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY)

export const hasToken = (): boolean => Boolean(getToken())

export const storeToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
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
    headers,
    ...rest
  } = options

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string> || {}),
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (!isFormData && body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (requiresAuth) {
    const token = getToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
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
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize))
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters?.search) params.append('search', filters.search)

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
  })

  downloadBlob(blob, `transactions_${Date.now()}.pdf`)
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
  return request<{ user: UserProfile; token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password },
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

export const logout = async (): Promise<void> => {
  await request<null>('/auth/logout', {
    method: 'POST',
    requiresAuth: true,
    notifyOnError: false,
  })
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
