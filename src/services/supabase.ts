import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({} as SupabaseClient)

export const createTransaction = async (transaction: {
  amount: number
  category: string
  date: string
  description: string
  type: 'income' | 'expense'
  image_url?: string
}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Supabase not configured, skipping transaction creation:', transaction)
    return transaction
  }
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()

  if (error) throw error
  return data[0]
}

export const getTransactions = async (filters?: {
  category?: string
  type?: 'income' | 'expense'
  startDate?: string
  endDate?: string
}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return [
      { id: 1, amount: 256.80, category: '餐饮', date: '2024-01-15', description: '超市购物', type: 'expense' as const },
      { id: 2, amount: 15000, category: '工资', date: '2024-01-10', description: '月薪', type: 'income' as const },
      { id: 3, amount: 128.50, category: '交通', date: '2024-01-14', description: '地铁充值', type: 'expense' as const },
      { id: 4, amount: 89.90, category: '购物', date: '2024-01-13', description: '日用品', type: 'expense' as const },
      { id: 5, amount: 5000, category: '投资', date: '2024-01-12', description: '基金定投', type: 'income' as const },
    ]
  }
  
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getCategories = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return [
      { id: 1, name: '餐饮' },
      { id: 2, name: '交通' },
      { id: 3, name: '购物' },
      { id: 4, name: '娱乐' },
      { id: 5, name: '医疗' },
      { id: 6, name: '教育' },
      { id: 7, name: '住房' },
      { id: 8, name: '工资' },
      { id: 9, name: '投资' },
      { id: 10, name: '其他' },
    ]
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
  if (error) throw error
  return data
}

export const uploadImage = async (file: File) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Supabase not configured, skipping image upload')
    return { path: 'mock-path' }
  }
  
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file)

  if (error) throw error
  return data
}

export const getImageUrl = (path: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return '#'
  }
  
  const { data } = supabase.storage
    .from('receipts')
    .getPublicUrl(path)
  return data.publicUrl
}

export const hasSupabaseConfig = () => {
  return !!supabaseUrl && !!supabaseAnonKey
}