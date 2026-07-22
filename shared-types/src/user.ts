/* ========== User / Auth ========== */
export interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url?: string
  role?: 'user' | 'admin'
  status?: 'active' | 'suspended' | 'deleted'
  current_book_id?: string
  created_at: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: UserProfile
  tokens: TokenPair
  // Taro 小程序使用扁平字段
  accessToken: string
  refreshToken: string
}

/* ========== OCR & Suggestions ========== */
export interface OcrResult {
  rawText: string
  amount?: string
  date?: string
  type?: 'expense' | 'income'
  note?: string
}

export interface CategorySuggestion {
  category_id: string
  category_name: string
  icon: string
  confidence: number
}
