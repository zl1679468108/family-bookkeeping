/* ========== Transaction ========== */
export interface Transaction {
  id: number
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  time?: string
  description?: string
  brand?: string
  image_urls?: string
  image_url_list?: string[]
  location_name?: string
  latitude?: number
  longitude?: number
  poi_id?: string | null
  created_at: string
  user_id?: string
  book_id?: string
}

export interface TransactionFilters {
  type?: 'income' | 'expense'
  category?: string
  startDate?: string
  endDate?: string
  view?: 'own' | 'all'
  bookId?: string
  page?: number
  pageSize?: number
  sortBy?: 'amount' | 'date'
  sortOrder?: 'asc' | 'desc'
  search?: string
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

// Taro-specific: create transaction input
export interface CreateTransactionInput {
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
  description?: string
  brand?: string
  image_urls?: string
  location_name?: string
  latitude?: number
  longitude?: number
}

// Taro-specific: batch operations
export type BatchOperation =
  | 'update_category'
  | 'update_type'
  | 'update_date'
  | 'move_book'
  | 'delete'

export interface BatchPayload {
  category_id?: string
  type?: 'income' | 'expense'
  date?: string
  book_id?: string
}

export interface BatchRequest {
  ids: number[]
  operation: BatchOperation
  payload?: BatchPayload
}

export interface BatchResponse {
  affected: number
}
