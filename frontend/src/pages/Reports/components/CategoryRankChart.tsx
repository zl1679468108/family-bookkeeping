import React, { useRef, useEffect } from 'react'
import { echarts } from '../../../utils/echarts'
import type { ECharts, EChartsOption } from '../../../utils/echarts'
import { formatAmount } from '../../../utils/common'
import type { MergedBreakdownItem } from '../hooks/useReportData'

interface CategoryRankChartProps {
  data: MergedBreakdownItem[]
  width?: string
  height?: string
}

export const CategoryRankChart: React.FC<CategoryRankChartProps> = ({
  data,
  width = '100%',
  height = '300px',
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    const timer = setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
      chartInstance.current = echarts.init(chartRef.current!)

      const pieData = data.map((d) => ({
        name: d.category_name,
        value: Number(d.amount),
      }))

      const option: EChartsOption = {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const v = params.value || 0
            return `${params.name}<br/>金额：${formatAmount(v)}<br/>占比：${params.percent}%`
          },
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { fontSize: 12, color: 'var(--fg)' },
        },
        series: [
          {
            name: '分类占比',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: 'var(--bg-card)', borderWidth: 2 },
            label: { show: true, formatter: '{b}: {d}%', fontSize: 11 },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: pieData,
          },
        ],
      }

      chartInstance.current.setOption(option as any)
      chartInstance.current.resize()
    }, 50)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  return <div ref={chartRef} style={{ width, height }} />
}
