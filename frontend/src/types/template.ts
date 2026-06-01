export interface Template {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  amount?: number;
  category_id?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
  merchant_name?: string;
  book_id?: string;
  sort_order: number;
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  type: 'expense' | 'income';
  amount?: number;
  category_id?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
  book_id?: string;
  sort_order?: number;
}

export interface ExecuteTemplateInput {
  amount?: number;
}

export interface ReorderInput {
  ids: string[];
}
