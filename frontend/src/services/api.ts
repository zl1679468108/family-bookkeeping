/**
 * API 服务 - 调用后端 NestJS API
 * 前缀: /api
 */

import { notify } from '../utils/notifications'
import { trackRequest } from '../utils/progress'
import type {
  Transaction,
  TransactionFilters,
  PaginatedResponse,
  UserProfile,
  TokenPair,
  OcrResult,
  CategorySuggestion,
  ApiEnvelope,
  ApiErrorPayload,
} from '@family-bookkeeping/shared-types'

// 兼容：重新导出常用类型（供已有 import 使用）
export type { Transaction, TransactionFilters, PaginatedResponse, UserProfile, TokenPair, OcrResult, CategorySuggestion, ApiEnvelope, ApiErrorPayload } from '@family-bookkeeping/shared-types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 双 Token 存储键
const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

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
  /** 是否静默：不显示错误通知，不跳转登录页，错误直接抛出 */
  silent?: boolean
  /**
   * 是否显示顶部进度条。
   * 未显式指定时：POST/PUT/DELETE/PATCH 写操作默认显示（按钮点击等显式交互），
   * GET/HEAD 等读操作默认不显示（页面初始化类加载走骨架屏即可）。
   */
  showProgress?: boolean
  /** 内部：标记本次请求为刷新令牌请求本身，避免 401 时递归触发自动刷新 */
  _internalRefresh?: boolean
}

const getToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY)

export const hasToken = (): boolean => Boolean(getToken())

/** 持久化访问令牌 + 刷新令牌（登录/注册/刷新成功后调用） */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim())
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim())
}

/** 仅更新访问令牌（刷新后调用） */
export const storeAccessToken = (accessToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim())
}

/** 兼容别名：写入访问令牌（单值场景） */
export const storeToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token.trim())
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ---- 自动刷新（single-flight）----
// 并发 401 共享同一个刷新 Promise，避免刷新风暴；刷新成功后重试原请求
let refreshPromise: Promise<TokenPair> | null = null

const tryRefresh = (): Promise<TokenPair> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new ApiError('登录状态已失效，请重新登录', 401)
      }
      const data = await request<TokenPair>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        silent: true,
        _internalRefresh: true,
      })
      storeTokens(data.accessToken, data.refreshToken)
      return data
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
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
    const data = await response.json()
    if (data && typeof data.message === 'string') {
      return data as ApiErrorPayload
    }
  } catch {
    // 解析失败，返回默认错误
  }
  return { message: response.statusText || '请求失败' }
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    body,
    requiresAuth = false,
    responseType = 'json',
    notifyOnError = true,
    silent = false,
    showProgress,
    headers,
    method,
    ...rest
  } = options

  // silent 模式下：不显示通知，不跳转登录，错误直接抛出
  const effectiveNotify = silent ? false : notifyOnError

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
      if (shouldShowProgress) {
        trackRequest(requestId, 'end')
      }
      if (!silent) {
        handleUnauthorized(effectiveNotify)
      }
      throw new ApiError('登录状态已失效，请重新登录', 401)
    }
    const trimmedToken = token.trim()
    requestHeaders.Authorization = `Bearer ${trimmedToken}`
  }

  // 全局超时：读操作 30s，写操作 60s（上传图片等可能比较慢）
  const timeoutMs = isWrite ? 60000 : 30000
  const abortController = new AbortController()
  const timeoutTimer = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      method: effectiveMethod,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: abortController.signal,
    })

    clearTimeout(timeoutTimer)

    if (!response.ok) {
      const errorPayload = await parseErrorPayload(response)
      let message = errorPayload.message || '请求失败'
      const status = errorPayload.statusCode || response.status

      // 服务端返回 503/504 时，统一为友好提示
      if (status === 503) {
        message = '服务暂不可用，请稍后重试'
      } else if (status === 504) {
        message = '请求超时，请稍后重试'
      } else if (status >= 500) {
        message = '服务器异常，请稍后重试'
      }

      const error = new ApiError(message, status, errorPayload.code)

      if (requiresAuth && response.status === 401) {
        // 双 Token：尝试用 refresh 换发新的 access，成功则重试原请求
        if (!options._internalRefresh && getRefreshToken()) {
          try {
            await tryRefresh()
            // 用新 access token 重试（_internalRefresh 防止刷新请求自身递归）
            return request<T>(path, { ...options, _internalRefresh: true })
          } catch {
            // 刷新失败，继续走下面的 401 处理
          }
        }
        if (!silent) {
          handleUnauthorized(effectiveNotify)
        }
      } else if (effectiveNotify) {
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
    clearTimeout(timeoutTimer)

    if (effectiveNotify && !(err instanceof ApiError)) {
      let message = err instanceof Error ? err.message : '请求失败'
      // AbortController 触发的 abort 错误
      if (err instanceof Error && (err.name === 'AbortError' || /aborted|timeout/i.test(message))) {
        message = '请求超时，请稍后重试'
      } else if (message === 'Failed to fetch') {
        message = '网络请求失败，请检查网络连接'
      } else if (message.includes('NetworkError')) {
        message = '网络错误，请检查网络连接'
      } else if (message.includes('timeout') || message.includes('Timeout')) {
        message = '请求超时，请稍后重试'
      }
      notify({ type: 'error', message })
    }
    throw err
  } finally {
    clearTimeout(timeoutTimer)
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
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize))
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters?.search) params.append('search', filters.search)
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

export const register = async (
  email: string,
  password: string,
  username: string,
): Promise<{ user: UserProfile; accessToken: string; refreshToken: string }> => {
  return request<{ user: UserProfile; accessToken: string; refreshToken: string }>('/auth/register', {
    method: 'POST',
    body: { email, password, username },
  })
}

export const login = async (
  email: string,
  password: string,
  captchaId: string,
  captchaCode: string,
): Promise<{ user: UserProfile; accessToken: string; refreshToken: string }> => {
  // 登录时不传递 token，直接创建新会话（带验证码的登录是新会话）
  return request<{ user: UserProfile; accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: { email, password, captchaId, captchaCode },
  })
}

// 切换账号（免验证码，使用已保存的账号密码 + 刷新令牌复用会话）
export const switchAccount = async (
  email: string,
  password: string,
  token?: string,
): Promise<{ user: UserProfile; accessToken: string; refreshToken: string }> => {
  return request<{ user: UserProfile; accessToken: string; refreshToken: string }>('/auth/switch-account', {
    method: 'POST',
    body: { email, password, token: token || undefined },
    notifyOnError: false,
  })
}

export const getCaptcha = async (): Promise<{ captchaId: string; svg: string }> => {
  return request<{ captchaId: string; svg: string }>('/auth/captcha')
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

export const resetPasswordByToken = async (
  token: string,
  password: string,
): Promise<void> => {
  await request<null>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
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

export const setCurrentBook = async (bookId: string): Promise<{ book_id: string }> => {
  return request<{ book_id: string }>('/auth/current-book', {
    method: 'PUT',
    body: { book_id: bookId },
    requiresAuth: true,
  });
}

/**
 * OCR 识别收据/账单图片
 * POST /api/ocr/receipt
 * 免费额度用完时后端返回 503，ApiError 会以错误通知显示
 */
export const ocrReceipt = async (file: Blob): Promise<OcrResult> => {
  const formData = new FormData()
  // compressImage 输出的 Blob 可能是 image/jpeg 或 image/png，
  // 后端 FileValidationPipe 要求扩展名与 MIME 一致
  const ext = file.type === 'image/png' ? '.png' : '.jpg'
  formData.append('file', file, `receipt${ext}`)
  return request<OcrResult>('/ocr/receipt', {
    method: 'POST',
    requiresAuth: true,
    body: formData,
    showProgress: true,
    // OCR 失败时不需要前端额外通知（后端已经有中文提示）
    notifyOnError: true,
  })
}

export const suggestCategory = async (params: { brand?: string; note?: string; amount?: number }): Promise<CategorySuggestion[]> => {
  const queryParams = new URLSearchParams();
  if (params.brand) queryParams.set('brand', params.brand);
  if (params.note) queryParams.set('note', params.note);
  if (params.amount) queryParams.set('amount', String(params.amount));
  return request<CategorySuggestion[]>(`/transactions/suggest-category?${queryParams.toString()}`, { requiresAuth: true });
}
