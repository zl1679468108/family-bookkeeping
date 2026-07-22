/* ========== Template ========== */
export interface Template {
  id: string
  user_id: string
  name: string
  type: 'expense' | 'income'
  amount: number | null
  category_id: string | null
  note: string | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  poi_id: string | null
  merchant_name: string | null
  book_id: string | null
  sort_order: number
  category_name?: string
  description?: string
  brand?: string
  icon?: string
  created_at: string
  frequency?: string
  start_date?: string
  end_date?: string
  last_executed_at?: string
}

export interface CreateTemplateInput {
  name: string
  type: 'expense' | 'income'
  amount?: number
  category_id?: string
  note?: string
  latitude?: number
  longitude?: number
  location_name?: string
  poi_id?: string
  book_id?: string
  sort_order?: number
  frequency?: string
  start_date?: string
  end_date?: string
}

export interface ExecuteTemplateInput {
  amount?: number
}

export interface ReorderInput {
  ids: string[]
}
