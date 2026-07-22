/**
 * useMonthRangeOptions — 月份范围选项生成器（年份分组）
 *
 * 生成近 3 年到未来 1 年的年月选项，按年份分组。
 * 可用于 DropdownSelect 组件的 options 属性。
 *
 * 用法：
 *  const { monthOptions, currentMonthKey } = useMonthRangeOptions()
 *  <DropdownSelect options={monthOptions} value={currentMonthKey} />
 */
import { useMemo } from 'react'
import { format } from 'date-fns'

interface UseMonthRangeOptionsProps {
  /** 往前年数，默认3 */
  yearsBefore?: number
  /** 往后年数，默认1 */
  yearsAfter?: number
}

export function useMonthRangeOptions(options: UseMonthRangeOptionsProps = {}) {
  const {
    yearsBefore = 3,
    yearsAfter = 1,
  } = options

  const currentMonthKey = useMemo(() => {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return format(firstOfMonth, 'yyyy-MM-dd')
  }, [])

  const monthOptions = useMemo(() => {
    const result: { key: string; label: string; isHeader?: boolean }[] = []
    const today = new Date()
    const currentYear = today.getFullYear()

    const startYear = currentYear - yearsBefore
    const endYear = currentYear + yearsAfter

    for (let year = startYear; year <= endYear; year++) {
      // 年份分组头
      result.push({
        key: `year-${year}`,
        label: `${year} 年`,
        isHeader: true,
      })
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        const key = format(date, 'yyyy-MM-dd')
        const label = format(date, 'MM 月')
        result.push({ key, label })
      }
    }

    return result
  }, [yearsBefore, yearsAfter])

  return {
    /** 月份选项列表（含年份分组头），可直接传给 DropdownSelect 的 options */
    monthOptions,
    /** 当前月份的 key，可作为默认值 */
    currentMonthKey,
  }
}
