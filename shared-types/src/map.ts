/* ========== Map ========== */
export interface MapTransaction {
  id: number
  type: 'income' | 'expense'
  category: string
  amount: number
  date: string
  description: string | null
  latitude: number
  longitude: number
  location_name: string
  poi_id: string | null
  userId?: string
  username?: string
}

export interface MerchantSummary {
  poi_id: string | null
  location_name: string
  total_amount: number
  transaction_count: number
  last_transaction_date: string
  expense_count: number
  income_count: number
  expense_total: number
  income_total: number
  last_expense_date: string | null
  last_income_date: string | null
  memberBreakdown?: MemberBreakdown[]
  latitude?: number
  longitude?: number
}

export interface MapFilters {
  startDate?: string
  endDate?: string
  type?: 'income' | 'expense'
  categories?: string[]
  minAmount?: number
  maxAmount?: number
  memberIds?: string[]
}

export interface LocationResult {
  latitude: number
  longitude: number
  locationName: string
  poiId: string | null
}

export interface MemberLocation {
  userId: string
  username: string
  email: string
  latitude: number
  longitude: number
  updatedAt: string
}

export interface MapMember {
  userId: string
  username: string
  role: 'owner' | 'member'
  color: string
}

export interface MemberBreakdown {
  userId: string
  username: string
  expenseTotal: number
  expenseCount: number
}

export interface LocationUpdateRequest {
  latitude: number
  longitude: number
  isSharing: boolean
}
