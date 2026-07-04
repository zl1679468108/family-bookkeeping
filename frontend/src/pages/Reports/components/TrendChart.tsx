import React, { useRef, useEffect, useMemo } from 'react'
import { echarts } from '../../../utils/echarts'
import type { ECharts, EChartsOption } from '../../../utils/echarts'
import { format, parseISO } from 'date-fns'
import { formatAmount } from '../../../utils/common'
import type { PeriodType } from '../hooks/useReportData'

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

    if (isDailyView) {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const exp = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const inc = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(exp)}<br/>总收入：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: chartData.dates },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatAmount(v) } },
        legend: { data: ['总支出', '总收入'], top: 5 },
        series: [
          { name: '总支出', type: 'bar', data: chartData.expenses, itemStyle: { color: '#e74c3c' } },
          { name: '总收入', type: 'bar', data: chartData.incomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else if (isMonthCompare) {
      const curLabel = format(now, 'yyyy 年 MM 月')
      const tgtLabel = format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const ce = params.find((p: any) => p.seriesName === `${curLabel} 总支出`)?.value || 0
            const ci = params.find((p: any) => p.seriesName === `${curLabel} 总收入`)?.value || 0
            const te = params.find((p: any) => p.seriesName === `${tgtLabel} 总支出`)?.value || 0
            const ti = params.find((p: any) => p.seriesName === `${tgtLabel} 总收入`)?.value || 0
            return `${params[0].name}<br/>${curLabel} 总支出：${formatAmount(ce)}<br/>${curLabel} 总收入：${formatAmount(ci)}<br/>${tgtLabel} 总支出：${formatAmount(te)}<br/>${tgtLabel} 总收入：${formatAmount(ti)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: chartData.dates },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatAmount(v) } },
        legend: { top: 5 },
        series: [
          { name: `${curLabel} 总支出`, type: 'bar', data: chartData.currExpenses, itemStyle: { color: '#c0392b' }, barGap: '20%' },
          { name: `${curLabel} 总收入`, type: 'bar', data: chartData.currIncomes, itemStyle: { color: '#1e8449' } },
          { name: `${tgtLabel} 总支出`, type: 'bar', data: chartData.targetExpenses, itemStyle: { color: '#e74c3c' } },
          { name: `${tgtLabel} 总收入`, type: 'bar', data: chartData.targetIncomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else if (isYearCompare) {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const ce = params.find((p: any) => p.seriesName === `${currentYear}年 总支出`)?.value || 0
            const ci = params.find((p: any) => p.seriesName === `${currentYear}年 总收入`)?.value || 0
            const te = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总支出`)?.value || 0
            const ti = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总收入`)?.value || 0
            return `${params[0].name}<br/>${currentYear}年 总支出：${formatAmount(ce)}<br/>${currentYear}年 总收入：${formatAmount(ci)}<br/>${yearCompareTarget}年 总支出：${formatAmount(te)}<br/>${yearCompareTarget}年 总收入：${formatAmount(ti)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: chartData.dates },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatAmount(v) } },
        legend: { top: 5 },
        series: [
          { name: `${currentYear}年 总支出`, type: 'bar', data: chartData.currentYearExpenses, itemStyle: { color: '#c0392b' }, barGap: '20%' },
          { name: `${currentYear}年 总收入`, type: 'bar', data: chartData.currentYearIncomes, itemStyle: { color: '#1e8449' } },
          { name: `${yearCompareTarget}年 总支出`, type: 'bar', data: chartData.targetYearExpenses, itemStyle: { color: '#e74c3c' } },
          { name: `${yearCompareTarget}年 总收入`, type: 'bar', data: chartData.targetYearIncomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else {
      option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const exp = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const inc = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(exp)}<br/>总收入：${formatAmount(inc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: chartData.dates },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatAmount(v) } },
        legend: { data: ['总支出', '总收入'], top: 5 },
        series: [
          { name: '总支出', type: 'bar', data: chartData.expenses, itemStyle: { color: '#e74c3c' } },
          { name: '总收入', type: 'bar', data: chartData.incomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    }

    chartInstance.current.setOption(option as any)
    chartInstance.current.resize()
  }, [chartData, period, now, currentYear, monthCompareTarget, yearCompareTarget, isDailyView, isMonthCompare, isYearCompare])

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}
