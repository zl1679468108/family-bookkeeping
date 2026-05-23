/**
 * API 服务 - 调用后端 NestJS API
 * 前缀: /api
 */

// 后端 API 基础地址
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api'

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
}

/**
 * 获取交易列表
 */
export const getTransactions = async (filters?: TransactionFilters): Promise<Transaction[]> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const url = `${API_BASE}/transactions${params.toString() ? '?' + params.toString() : ''}`

  const response = await authFetch(url)
  if (!response.ok) {
    throw new Error('获取交易记录失败')
  }

  return await response.json()
}

/**
 * 获取单个交易
 */
export const getTransaction = async (id: number): Promise<Transaction> => {
  const response = await authFetch(`${API_BASE}/transactions/${id}`)
  if (!response.ok) {
    throw new Error('获取交易记录失败')
  }

  return await response.json()
}

/**
 * 创建交易
 */
export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  const response = await authFetch(`${API_BASE}/transactions`, {
    method: 'POST',
    body: JSON.stringify(transaction),
  })

  if (!response.ok) {
    throw new Error('创建交易记录失败')
  }

  return await response.json()
}

/**
 * 更新交易
 */
export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  const response = await authFetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  })

  if (!response.ok) {
    throw new Error('更新交易记录失败')
  }

  return await response.json()
}

/**
 * 删除交易
 */
export const deleteTransaction = async (id: number): Promise<void> => {
  const response = await authFetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('删除交易记录失败')
  }
}

/**
 * 导出 Excel
 */
export const exportToExcel = async (filters?: TransactionFilters): Promise<void> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const url = `${API_BASE}/export/excel${params.toString() ? '?' + params.toString() : ''}`

  // 使用 fetch 下载文件
  const response = await authFetch(url)
  if (!response.ok) {
    throw new Error('导出 Excel 失败')
  }

  const blob = await response.blob()

  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `transactions_${Date.now()}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

/**
 * 导出 PDF
 */
export const exportToPDF = async (filters?: TransactionFilters): Promise<void> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const url = `${API_BASE}/export/pdf${params.toString() ? '?' + params.toString() : ''}`

  // 使用 fetch 下载文件
  const response = await authFetch(url)
  if (!response.ok) {
    throw new Error('导出 PDF 失败')
  }

  const blob = await response.blob()

  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `transactions_${Date.now()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

/**
 * 健康检查
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}

// ============ 认证相关 API ============

const getToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token)
}

const clearToken = (): void => {
  localStorage.removeItem('auth_token')
}

// 为认证请求添加 token
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 如果返回 401，清除 token
  if (response.status === 401) {
    clearToken()
  }

  return response
}

/**
 * 用户注册
 */
export const register = async (email: string, password: string, username: string): Promise<{ user: any; token: string }> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '注册失败')
  }

  const data = await response.json()
  setToken(data.token)
  return data
}

/**
 * 用户登录
 */
export const login = async (email: string, password: string): Promise<{ user: any; token: string }> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '登录失败')
  }

  const data = await response.json()
  setToken(data.token)
  return data
}

/**
 * 忘记密码
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throw new Error('密码重置请求失败')
  }
}

/**
 * 获取用户信息
 */
export const getProfile = async (): Promise<any> => {
  const response = await authFetch(`${API_BASE}/auth/profile`)

  if (!response.ok) {
    throw new Error('获取用户信息失败')
  }

  return await response.json()
}

/**
 * 退出登录
 */
export const logout = (): void => {
  clearToken()
}

/**
 * API 客户端 - 用于支持 apiClient.post() 等调用方式
 */
export const apiClient = {
  post: async (url: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw error
    }
    
    return await response.json()
  },
  get: async (url: string): Promise<any> => {
    const response = await authFetch(`${API_BASE}${url}`)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw error
    }
    
    return await response.json()
  },
  put: async (url: string, data: any): Promise<any> => {
    const response = await authFetch(`${API_BASE}${url}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw error
    }
    
    return await response.json()
  },
  delete: async (url: string): Promise<any> => {
    const response = await authFetch(`${API_BASE}${url}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw error
    }
    
    return await response.json()
  },
}
