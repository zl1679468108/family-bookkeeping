export const expenseCategoryDict = {
  food: { name: '食品', icon: '🛒' },
  food_delivery: { name: '餐饮', icon: '🍜' },
  transport: { name: '交通', icon: '🚗' },
  shopping: { name: '购物', icon: '🛍️' },
  utilities: { name: '通讯', icon: '📱' },
  housing: { name: '居住', icon: '🏠' },
  entertainment: { name: '娱乐', icon: '🎮' },
  medical: { name: '医疗', icon: '💊' },
  education: { name: '教育', icon: '📚' },
  other: { name: '其他', icon: '📌' }
}

export const incomeCategoryDict = {
  salary: { name: '工资', icon: '💼' },
  bonus: { name: '奖金', icon: '🎁' },
  investment: { name: '投资', icon: '📈' },
  freelance: { name: '兼职', icon: '💻' },
  gift: { name: '礼金', icon: '🎁' },
  other_income: { name: '其他收入', icon: '💰' }
}

export type ExpenseCategoryKey = keyof typeof expenseCategoryDict
export type IncomeCategoryKey = keyof typeof incomeCategoryDict
export type CategoryKey = ExpenseCategoryKey | IncomeCategoryKey

export const expenseCategoryOptions = Object.entries(expenseCategoryDict).map(([value, { name, icon }]) => ({
  value,
  label: `${icon} ${name}`
}))

export const incomeCategoryOptions = Object.entries(incomeCategoryDict).map(([value, { name, icon }]) => ({
  value,
  label: `${icon} ${name}`
}))

export const expenseCategoryLabels = Object.entries(expenseCategoryDict).map(([value, { name }]) => ({
  value,
  label: name
}))

export const incomeCategoryLabels = Object.entries(incomeCategoryDict).map(([value, { name }]) => ({
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