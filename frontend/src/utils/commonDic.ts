// 注意：分类数据（名称、图标、类型）已迁移到后端数据库 categories 表
// 前端通过 hooks/useCategories.ts 统一获取
// 本文件仅保留类型和筛选常量

export const typeDict = {
  expense: { name: '支出', symbol: '-' },
  income: { name: '收入', symbol: '+' }
}

export type TypeKey = keyof typeof typeDict

export const typeOptions = Object.entries(typeDict).map(([value, { name }]) => ({
  value,
  label: name
}))

export const filterOptions = ['全部', '收入', '支出', '食品', '交通', '购物', '通讯', '居住', '娱乐', '医疗', '教育', '其他']
