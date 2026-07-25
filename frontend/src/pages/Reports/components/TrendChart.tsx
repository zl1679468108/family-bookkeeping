import React, { useRef, useEffect, useMemo } from 'react'
import { echarts } from '../../../utils/echarts'
import type { ECharts, EChartsOption } from '../../../utils/echarts'
import { formatAmount } from '../../../utils/common'
import type { PeriodType } from '../hooks/useReportData'
import { getEchartsChrome, getThemeColors } from '../../../utils/themeColors'
import { useTheme } from '../../../utils/theme'
import { formatMonthDisplay } from '../../../utils/month'
import { FIELD_TOTAL_INCOME, FIELD_TOTAL_EXPENSE } from '../../../utils/fieldCopy'
import {
  buildDailyTrendSeries,
  buildMonthCompareSeries,
  buildYearCompareSeries,
  buildMonthlyTrendSeries,
  formatReportCompareTooltip,
  reportYearLabel,
  reportTrendSeriesName,
  type ReportTrendSeriesLoose,
} from '../../../utils/reportChart'

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

  const chartData = useMemo((): ReportTrendSeriesLoose => {
    if (isDailyView) return buildDailyTrendSeries(dailyData)
    if (isMonthCompare) return buildMonthCompareSeries(monthCompareData)
    if (isYearCompare) return buildYearCompareSeries(yoyExpenseData, yoyIncomeData)
    return buildMonthlyTrendSeries(trendData)
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
            const exp = params.find((p: any) => p.seriesName === FIELD_TOTAL_EXPENSE)?.value || 0
            const inc = params.find((p: any) => p.seriesName === FIELD_TOTAL_INCOME)?.value || 0
            return `${params[0].name}<br/>${FIELD_TOTAL_EXPENSE}：${formatAmount(exp)}<br/>${FIELD_TOTAL_INCOME}：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { data: [FIELD_TOTAL_EXPENSE, FIELD_TOTAL_INCOME], top: 5, textStyle: chrome.legendText },
        series: [
          { name: FIELD_TOTAL_EXPENSE, type: 'bar', data: chartData.expenses, itemStyle: { color: getThemeColors().exp } },
          { name: FIELD_TOTAL_INCOME, type: 'bar', data: chartData.incomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else if (isMonthCompare) {
      const curLabel = formatMonthDisplay(now)
      const tgtLabel = formatMonthDisplay(monthCompareTarget)
      const curExpenseName = reportTrendSeriesName(curLabel, FIELD_TOTAL_EXPENSE)
      const curIncomeName = reportTrendSeriesName(curLabel, FIELD_TOTAL_INCOME)
      const targetExpenseName = reportTrendSeriesName(tgtLabel, FIELD_TOTAL_EXPENSE)
      const targetIncomeName = reportTrendSeriesName(tgtLabel, FIELD_TOTAL_INCOME)
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => formatReportCompareTooltip({
            points: params,
            currentLabel: curLabel,
            targetLabel: tgtLabel,
            expenseLabel: FIELD_TOTAL_EXPENSE,
            incomeLabel: FIELD_TOTAL_INCOME,
            formatAmount,
          }),
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { top: 5, textStyle: chrome.legendText },
        series: [
          { name: curExpenseName, type: 'bar', data: chartData.currExpenses, itemStyle: { color: getThemeColors().exp }, barGap: '20%' },
          { name: curIncomeName, type: 'bar', data: chartData.currIncomes, itemStyle: { color: getThemeColors().inc } },
          { name: targetExpenseName, type: 'bar', data: chartData.targetExpenses, itemStyle: { color: getThemeColors().exp } },
          { name: targetIncomeName, type: 'bar', data: chartData.targetIncomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else if (isYearCompare) {
      const curLabel = reportYearLabel(currentYear)
      const tgtLabel = reportYearLabel(yearCompareTarget)
      const curExpenseName = reportTrendSeriesName(curLabel, FIELD_TOTAL_EXPENSE)
      const curIncomeName = reportTrendSeriesName(curLabel, FIELD_TOTAL_INCOME)
      const targetExpenseName = reportTrendSeriesName(tgtLabel, FIELD_TOTAL_EXPENSE)
      const targetIncomeName = reportTrendSeriesName(tgtLabel, FIELD_TOTAL_INCOME)
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => formatReportCompareTooltip({
            points: params,
            currentLabel: curLabel,
            targetLabel: tgtLabel,
            expenseLabel: FIELD_TOTAL_EXPENSE,
            incomeLabel: FIELD_TOTAL_INCOME,
            formatAmount,
          }),
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { top: 5, textStyle: chrome.legendText },
        series: [
          { name: curExpenseName, type: 'bar', data: chartData.currentYearExpenses, itemStyle: { color: getThemeColors().exp }, barGap: '20%' },
          { name: curIncomeName, type: 'bar', data: chartData.currentYearIncomes, itemStyle: { color: getThemeColors().inc } },
          { name: targetExpenseName, type: 'bar', data: chartData.targetYearExpenses, itemStyle: { color: getThemeColors().exp } },
          { name: targetIncomeName, type: 'bar', data: chartData.targetYearIncomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    } else {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chrome.tooltip,
          formatter: (params: any) => {
            const exp = params.find((p: any) => p.seriesName === FIELD_TOTAL_EXPENSE)?.value || 0
            const inc = params.find((p: any) => p.seriesName === FIELD_TOTAL_INCOME)?.value || 0
            return `${params[0].name}<br/>${FIELD_TOTAL_EXPENSE}：${formatAmount(exp)}<br/>${FIELD_TOTAL_INCOME}：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: axisX,
        yAxis: axisY,
        legend: { data: [FIELD_TOTAL_EXPENSE, FIELD_TOTAL_INCOME], top: 5, textStyle: chrome.legendText },
        series: [
          { name: FIELD_TOTAL_EXPENSE, type: 'bar', data: chartData.expenses, itemStyle: { color: getThemeColors().exp } },
          { name: FIELD_TOTAL_INCOME, type: 'bar', data: chartData.incomes, itemStyle: { color: getThemeColors().inc } },
        ],
      }
    }

    chartInstance.current.setOption(option as any)
    chartInstance.current.resize()
  }, [chartData, period, now, currentYear, monthCompareTarget, yearCompareTarget, isDailyView, isMonthCompare, isYearCompare, resolvedTheme])

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}
