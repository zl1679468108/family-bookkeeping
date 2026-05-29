/**
 * 分类颜色工具
 * 基于分类 name 动态生成一致的颜色（适配用户自定义分类）
 */

const COLOR_PALETTE = [
  '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE',
  '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#67C23A',
  '#E6A23C', '#409EFF', '#FF6B6B', '#4ECDC4', '#FFE66D',
  '#1A535C', '#FF9F1C', '#2EC4B6', '#E71D36', '#011627',
];

/**
 * 根据分类名称生成一致的颜色（简单哈希）
 */
export function getCategoryColor(categoryName: string): string {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
    hash |= 0; // 32-bit int
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/** 根据类型返回默认颜色 */
export function getTypeColor(type: 'income' | 'expense'): string {
  return type === 'income' ? '#67C23A' : '#EE6666';
}
