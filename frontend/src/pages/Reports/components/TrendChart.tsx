import React, { useRef, useEffect, useMemo } from 'react'
import { echarts } from '../../../utils/echarts'
import type { ECharts, EChartsOption } from '../../../utils/echarts'
import { formatAmount } from '../../../utils/common'
import type { PeriodType } from '../hooks/useReportData'
import { getEchartsChrome, getThemeColors } from '../../../utils/themeColors'
import { useTheme } from '../../../utils/theme'
import { formatMonthDisplay } from '../../../utils/month'

interface TrendChartProps {
  period: PeriodType
  now: Date
  currentYear: number
  monthCompareTarget: string
  yearCompareTarget: number
  isDailyView: boolean
  isMonthCompare: boolean
  isYearCompare: boolean
  isMonthlyView: boolean
  dailyData: any[]
  monthCompareData: { currentMonth: any[]; targetMonth: any[] }
  yoyExpenseData: any[]
  yoyIncomeData: any[]
  trendData: any[]
  mainLoading: boolean
}

export const TrendChart: React.FC<TrendChartProps> = ({
  period, now, currentYear, monthCompareTarget, yearCompareTarget,
  isDailyView, isMonthCompare, isYearCompare, isMonthlyView,
  dailyData, monthCompareData, yoyExpenseData, yoyIncomeData, trendData, mainLoading,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<ECharts | null>(null)
  const { resolvedTheme } = useTheme()

  const chartData = useMemo(() => {
    if (isDailyView) {
      return {
        dates: dailyData.map((d) => `${parseInt(d.date.slice(8, 10), 10)}日`),
        expenses: dailyData.map((d) => Number(d.total_expense || 0)),
        incomes: dailyData.map((d) => Number(d.total_income || 0)),
      }
    }
    if (isMonthCompare) {
      const maxDays = Math.max(monthCompareData.currentMonth.length, monthCompareData.targetMonth.length)
      return {
        dates: Array.from({ length: maxDays }, (_, i) => `${i + 1}日`),
        currExpenses: monthCompareData.currentMonth.map((d) => Number(d.total_expense || 0)),
        currIncomes: monthCompareData.currentMonth.map((d) => Number(d.total_income || 0)),
        targetExpenses: monthCompareData.targetMonth.map((d) => Number(d.total_expense || 0)),
        targetIncomes: monthCompareData.targetMonth.map((d) => Number(d.total_income || 0)),
      }
    }
    if (isYearCompare) {
      return {
        dates: yoyExpenseData.map((d) => d.monthLabel),
        currentYearExpenses: yoyExpenseData.map((d) => Number(d.currentYear || 0)),
        targetYearExpenses: yoyExpenseData.map((d) => Number(d.lastYear || 0)),
        currentYearIncomes: yoyIncomeData.map((d) => Number(d.currentYear || 0)),
        targetYearIncomes: yoyIncomeData.map((d) => Number(d.lastYear || 0)),
      }
    }
    return {
      dates: trendData.map((d) => d.month.slice(5) + '月'),
      expenses: trendData.map((d) => Number(d.expense || 0)),
      incomes: trendData.map((d) => Number(d.income || 0)),
    }
  }, [isDailyView, isMonthCompare, isYearCompare, dailyData, monthCompareData, yoyExpenseData, yoyIncomeData, trendData])

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }
    chartInstance.current = echarts.init(chartRef.current)
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      // T-M30: 组件卸载时 dispose ECharts 实例
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [period])

  useEffect(() => {
    if (!chartInstance.current || !chartData) return
    let option: EChartsOption = {}
    const theme = getThemeColors()
    const chrome = getEchartsChrome(theme)
    const axisX = { type: 'category' as const, data: chartData.dates, axisLabel: chrome.axisLabel, axisLine: chrome.axisLine }
    const axisY = {
      type: 'value' as const,
      axisLabel: { ...chrome.axisLabel, formatter: (v: number) => formatAmount(v) },
      splitLine: chrome.splitLine,
      axisLine: { show: false },
    }

    if (isDailyView) {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => {
            const exp = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const inc = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(exp)}<br/>总收入：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { data: ['总支出', '总收入'], top: 5, textStyle: chrome.legendText },
        series: [
          { name: '总支出', type: 'bar', data: chartData.expenses, itemStyle: { color: getThemeColors().exp } },
          { name: '总收入', type: 'bar', data: chartData.incomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else if (isMonthCompare) {
      const curLabel = formatMonthDisplay(now)
      const tgtLabel = formatMonthDisplay(monthCompareTarget)
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => {
            const ce = params.find((p: any) => p.seriesName === `${curLabel} 总支出`)?.value || 0
            const ci = params.find((p: any) => p.seriesName === `${curLabel} 总收入`)?.value || 0
            const te = params.find((p: any) => p.seriesName === `${tgtLabel} 总支出`)?.value || 0
            const ti = params.find((p: any) => p.seriesName === `${tgtLabel} 总收入`)?.value || 0
            return `${params[0].name}<br/>${curLabel} 总支出：${formatAmount(ce)}<br/>${curLabel} 总收入：${formatAmount(ci)}<br/>${tgtLabel} 总支出：${formatAmount(te)}<br/>${tgtLabel} 总收入：${formatAmount(ti)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { top: 5, textStyle: chrome.legendText },
        series: [
          { name: `${curLabel} 总支出`, type: 'bar', data: chartData.currExpenses, itemStyle: { color: getThemeColors().exp }, barGap: '20%' },
          { name: `${curLabel} 总收入`, type: 'bar', data: chartData.currIncomes, itemStyle: { color: getThemeColors().inc } },
          { name: `${tgtLabel} 总支出`, type: 'bar', data: chartData.targetExpenses, itemStyle: { color: getThemeColors().exp } },
          { name: `${tgtLabel} 总收入`, type: 'bar', data: chartData.targetIncomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else if (isYearCompare) {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => {
            const ce = params.find((p: any) => p.seriesName === `${currentYear}年 总支出`)?.value || 0
            const ci = params.find((p: any) => p.seriesName === `${currentYear}年 总收入`)?.value || 0
            const te = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总支出`)?.value || 0
            const ti = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总收入`)?.value || 0
            return `${params[0].name}<br/>${currentYear}年 总支出：${formatAmount(ce)}<br/>${currentYear}年 总收入：${formatAmount(ci)}<br/>${yearCompareTarget}年 总支出：${formatAmount(te)}<br/>${yearCompareTarget}年 总收入：${formatAmount(ti)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { top: 5, textStyle: chrome.legendText },
        series: [
          { name: `${currentYear}年 总支出`, type: 'bar', data: chartData.currentYearExpenses, itemStyle: { color: getThemeColors().exp }, barGap: '20%' },
          { name: `${currentYear}年 总收入`, type: 'bar', data: chartData.currentYearIncomes, itemStyle: { color: getThemeColors().inc } },
          { name: `${yearCompareTarget}年 总支出`, type: 'bar', data: chartData.targetYearExpenses, itemStyle: { color: getThemeColors().exp } },
          { name: `${yearCompareTarget}年 总收入`, type: 'bar', data: chartData.targetYearIncomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => {
            const exp = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const inc = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(exp)}<br/>总收入：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { data: ['总支出', '总收入'], top: 5, textStyle: chrome.legendText },
        series: [
          { name: '总支出', type: 'bar', data: chartData.expenses, itemStyle: { color: getThemeColors().exp } },
          { name: '总收入', type: 'bar', data: chartData.incomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    }

    chartInstance.current.setOption(option as any)
    chartInstance.current.resize()
  }, [chartData, period, now, currentYear, monthCompareTarget, yearCompareTarget, isDailyView, isMonthCompare, isYearCompare, resolvedTheme])

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}
