/** Category color mapping — generates consistent light-tinted backgrounds. */
const COLOR_MAP: Record<string, string> = {
  '餐饮': 'bg-category-orange', '食物': 'bg-category-orange', '快餐': 'bg-category-orange',
  '交通': 'bg-category-blue', '出行': 'bg-category-blue', '地铁': 'bg-category-blue', '公交': 'bg-category-blue',
  '购物': 'bg-category-pink', '衣服': 'bg-category-pink', '日用': 'bg-category-pink',
  '娱乐': 'bg-category-purple', '游戏': 'bg-category-purple', '电影': 'bg-category-purple',
  '居家': 'bg-category-amber', '房租': 'bg-category-amber', '水电': 'bg-category-amber', '物业': 'bg-category-amber',
  '医疗': 'bg-category-teal', '健康': 'bg-category-teal',
  '教育': 'bg-category-green', '学习': 'bg-category-green',
  '工资': 'bg-category-green', '兼职': 'bg-category-green', '理财': 'bg-category-amber',
};
const FALLBACK = 'bg-gray-100';

export function getCategoryBg(name: string): string {
  for (const [keyword, cls] of Object.entries(COLOR_MAP)) {
    if (name.includes(keyword)) return cls;
  }
  return FALLBACK;
}
