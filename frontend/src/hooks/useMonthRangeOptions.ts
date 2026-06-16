/**
 * useMonthRangeOptions — 月份范围选项生成器
 *
 * 生成以今年为准，往前5年往后5年的年月选项
 * 可用于 DropdownSelect 组件的 options 属性
 *
 * 用法：
 *  const { monthOptions, currentMonthKey } = useMonthRangeOptions()
 *  <DropdownSelect options={monthOptions} value={currentMonthKey} showSearch />
 */
import { useMemo } from 'react'
import { format } from 'date-fns'

interface UseMonthRangeOptionsProps {
  /** 往前年数，默认5 */
  yearsBefore?: number
  /** 往后年数，默认5 */
  yearsAfter?: number
  /** 显示格式，默认 'yyyy 年 MM 月' */
  formatStr?: string
}

export function useMonthRangeOptions(options: UseMonthRangeOptionsProps = {}) {
  const {
    yearsBefore = 5,
    yearsAfter = 5,
    formatStr = 'yyyy 年 MM 月',
  } = options

  const currentMonthKey = useMemo(() => {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return format(firstOfMonth, 'yyyy-MM-dd')
  }, [])

  const monthOptions = useMemo(() => {
    const result: { key: string; label: string }[] = []
    const today = new Date()
    const currentYear = today.getFullYear()

    const startYear = currentYear - yearsBefore
    const endYear = currentYear + yearsAfter

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        const key = format(date, 'yyyy-MM-dd')
        const label = format(date, formatStr)
        result.push({ key, label })
      }
    }

    // 按时间倒序排列（最新的在前）
    return result.reverse()
  }, [yearsBefore, yearsAfter, formatStr])

  return {
    /** 月份选项列表，可直接传给 DropdownSelect 的 options */
    monthOptions,
    /** 当前月份的 key，可作为默认值 */
    currentMonthKey,
  }
}
