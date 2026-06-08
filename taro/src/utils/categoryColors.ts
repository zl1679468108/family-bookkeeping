/** Category color mapping — generates consistent light-tinted backgrounds. */
const COLOR_MAP: Record<string, string> = {
  餐饮: "bg-expense-bg",
  食物: "bg-expense-bg",
  快餐: "bg-expense-bg",
  交通: "bg-primary-bg",
  出行: "bg-primary-bg",
  地铁: "bg-primary-bg",
  公交: "bg-primary-bg",
  购物: "bg-expense-bg",
  衣服: "bg-expense-bg",
  日用: "bg-expense-bg",
  娱乐: "bg-primary-bg",
  游戏: "bg-primary-bg",
  电影: "bg-primary-bg",
  居家: "bg-primary-bg",
  房租: "bg-expense-bg",
  水电: "bg-expense-bg",
  物业: "bg-expense-bg",
  医疗: "bg-primary-bg",
  健康: "bg-primary-bg",
  教育: "bg-primary-bg",
  学习: "bg-primary-bg",
  工资: "bg-primary-bg",
  兼职: "bg-primary-bg",
  理财: "bg-primary-bg",
};
const FALLBACK = "bg-subtle";

export function getCategoryBg(name: string): string {
  for (const [keyword, cls] of Object.entries(COLOR_MAP)) {
    if (name.includes(keyword)) return cls;
  }
  return FALLBACK;
}
