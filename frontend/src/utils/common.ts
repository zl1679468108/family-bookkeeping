export function formatAmount(amount: number | string, showSign = false, sign: '+' | '-' = '+'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) {
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

export function parseAmount(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

export function formatDate(dateStr: string, mode: 'full' | 'dashboard' = 'full'): string {
  const date = new Date(dateStr.replace(' ', 'T'))
  
  if (isNaN(date.getTime())) {
    return dateStr
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (mode === 'dashboard') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const transactionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (transactionDay.getTime() === today.getTime()) {
      return `今天 ${hours}:${minutes}`
    } else if (transactionDay.getTime() === yesterday.getTime()) {
      return `昨天 ${hours}:${minutes}`
    } else {
      return `${month}月${day}日 ${hours}:${minutes}`
    }
  }

  return `${month}月${day}日 ${hours}:${minutes}`
}