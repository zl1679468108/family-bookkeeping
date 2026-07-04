export interface MemberCategoryBreakdown {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

export interface MemberComparisonItem {
  user_id: string;
  user_name: string;
  total_expense: number;
  categories: MemberCategoryBreakdown[];
}

export interface MemberComparisonParams {
  month_from: string;
  month_to: string;
}
