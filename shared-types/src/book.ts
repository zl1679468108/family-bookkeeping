/* ========== Book ========== */
export interface Book {
  id: string
  name: string
  owner_id: string
  is_archived?: boolean
  icon?: string
  description?: string
  role?: string
  txn_count?: number
  member_count?: number
  created_at: string
  updated_at: string
}

export interface BookMember {
  id: string
  book_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export type BookRole = 'owner' | 'member'
