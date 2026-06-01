export type BatchOperation =
  | 'update_category'
  | 'update_type'
  | 'update_date'
  | 'move_book'
  | 'delete';

export interface BatchPayload {
  category_id?: string;
  type?: 'income' | 'expense';
  date?: string;
  book_id?: string;
}

export interface BatchRequest {
  ids: number[];
  operation: BatchOperation;
  payload?: BatchPayload;
}

export interface BatchResponse {
  affected: number;
}
