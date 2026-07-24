import React, { useEffect, useRef } from 'react';
import { echarts } from '../../utils/echarts';
import type { ECharts } from '../../utils/echarts';
import { getThemeColors } from '../../utils/themeColors'
import { formatMoney } from '../../utils/budget'

interface MonthlyItem {
  month: number;
  income: number;
  expense: number;
}

interface ReportMonthlyTrendProps {
  data: MonthlyItem[];
}

export const ReportMonthlyTrend: React.FC<ReportMonthlyTrendProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
      (chartRef.current as any).__echarts_instance__ = instanceRef.current;
    }

    const months = data.map((d) => `${d.month}月`);
    const incomes = data.map((d) => d.income);
    const expenses = data.map((d) => d.expense);
    const theme = getThemeColors();
    const textColor = theme.fg3;
    const gridColor = theme.bd;
    const bgColor = theme.srf;

    instanceRef.current.setOption({
      backgroundColor: bgColor,
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.srfH,
        borderColor: gridColor,
        textStyle: { color: theme.fg },
        formatter: (params: any) => {
          let result = `<div style="padding: 8px;">`;
          params.forEach((item: any) => {
            result += `<div style="display: flex; justify-content: space-between; gap: 20px; margin: 4px 0;">
              <span>${item.marker} ${item.seriesName}</span>
              <span style="font-weight: 600;">${formatMoney(item.value, { compact: true })}</span>
            </div>`;
          });
          result += `</div>`;
          return result;
        },
      },
      legend: {
        data: ['收入', '支出'],
        bottom: 0,
        textStyle: { color: textColor, fontSize: 12 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      grid: {
        left: '10px',
        right: '10px',
        top: '10px',
        bottom: '40px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textColor, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return String(value);
          },
        },
      },
      series: [
        {
          name: '收入',
          type: 'line',
          data: incomes,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: theme.inc, width: 3 },
          itemStyle: { color: theme.inc, borderColor: bgColor, borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.inc + '4D' },
              { offset: 1, color: theme.inc + '05' },
            ]),
          },
        },
        {
          name: '支出',
          type: 'line',
          data: expenses,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: theme.exp, width: 3 },
          itemStyle: { color: theme.exp, borderColor: bgColor, borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.exp + '4D' },
              { offset: 1, color: theme.exp + '05' },
            ]),
          },
        },
      ],
    });

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: '16px',
        }}
      >
        📈 12个月收支趋势
      </h2>
      <div
        ref={chartRef}
        style={{
          height: '280px',
          width: '100%',
          background: 'var(--srf)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--bd)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      />
    </div>
  );
};

export default ReportMonthlyTrend;