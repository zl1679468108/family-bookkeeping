/**
 * useMonthRangeOptions — 月份范围选项生成器（年份分组）
 *
 * 纯数据见 shared-utils generateMonthOptions / currentMonthKey
 *
 * 用法：
 *  const { monthOptions, currentMonthKey } = useMonthRangeOptions()
 *  <DropdownSelect options={monthOptions} value={currentMonthKey} />
 */
import { useMemo } from 'react'
import {
  generateMonthOptions,
  currentMonthKey as getCurrentMonthKey,
  type MonthOption,
} from '../utils/month'

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

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), [])

  const monthOptions = useMemo(
    () =>
      generateMonthOptions({
        yearsBefore,
        yearsAfter,
        keyFormat: 'monthDay',
        labelStyle: 'monthOnly',
        withYearHeaders: true,
      }) as MonthOption[],
    [yearsBefore, yearsAfter],
  )

  return {
    /** 月份选项列表（含年份分组头），可直接传给 DropdownSelect 的 options */
    monthOptions,
    /** 当前月份的 key，可作为默认值 */
    currentMonthKey,
  }
}
