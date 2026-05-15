export const categoryDict = {
  food: { name: '食品', icon: '🛒' },
  transport: { name: '交通', icon: '🚗' },
  shopping: { name: '购物', icon: '🛍️' },
  utilities: { name: '通讯', icon: '📱' },
  housing: { name: '居住', icon: '🏠' },
  entertainment: { name: '娱乐', icon: '🎮' },
  medical: { name: '医疗', icon: '💊' },
  education: { name: '教育', icon: '📚' },
  income: { name: '收入', icon: '💰' },
  other: { name: '其他', icon: '📌' },
  food_delivery: { name: '餐饮', icon: '🍜' }
}

export type CategoryKey = keyof typeof categoryDict

export const categoryOptions = Object.entries(categoryDict).map(([value, { name, icon }]) => ({
  value,
  label: `${icon} ${name}`
}))

export const categoryLabels = Object.entries(categoryDict).map(([value, { name }]) => ({
  value,
  label: name
}))

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