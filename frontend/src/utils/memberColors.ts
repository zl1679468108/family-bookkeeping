/**
 * 成员颜色池 — 10 色固定配色，按成员 joined_at 顺序循环分配。
 * 在整个应用中作为成员颜色的唯一来源。
 */
export const MEMBER_COLORS = [
  '#E74C3C', // 红
  '#E67E22', // 橙
  '#F1C40F', // 黄
  '#2ECC71', // 绿
  '#1ABC9C', // 青
  '#3498DB', // 蓝
  '#9B59B6', // 紫
  '#E91E63', // 粉
  '#795548', // 棕
  '#607D8B', // 灰蓝
] as const;

export type MemberColor = typeof MEMBER_COLORS[number];

/**
 * 按索引获取成员颜色，越界时循环取余
 * @param index - 成员序号（0-based）
 * @returns 对应的十六进制色值
 */
export function getMemberColor(index: number): MemberColor {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}
