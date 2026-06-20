export function formatAmount(amount: number | string, showSign = false, sign: '+' | '-' = '+'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (Number.isNaN(num)) {
    return '¥ 0.00'
  }

  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (showSign) {
    return `${sign}¥ ${formatted}`
  }

  return `¥ ${formatted}`
}

export function formatAmountWithType(amount: number | string, isIncome: boolean): string {
  const sign = isIncome ? '+' : '-'
  return formatAmount(amount, true, sign as '+' | '-')
}

export function formatDate(dateStr: string, mode: 'full' | 'dashboard' = 'full'): string {
  const date = new Date(dateStr.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) {
    return dateStr
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (mode === 'dashboard') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const transactionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (transactionDay.getTime() === today.getTime()) {
      return '今天'
    } else if (transactionDay.getTime() === yesterday.getTime()) {
      return '昨天'
    } else if (year === today.getFullYear()) {
      return `${month}月${day}日`
    } else {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    }
  }

  // full 模式：仅展示 年-月-日（交易数据只有年月日，没有时分秒）
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}