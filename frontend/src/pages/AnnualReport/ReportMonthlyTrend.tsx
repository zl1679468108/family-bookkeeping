import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface MonthlyItem {
  month: number;
  income: number;
  expense: number;
}

interface ReportMonthlyTrendProps {
  data: MonthlyItem[];
}

/**
 * 月度趋势图 - ECharts 双线图
 */
export const ReportMonthlyTrend: React.FC<ReportMonthlyTrendProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }

    const months = data.map((d) => `${d.month}月`);
    const incomes = data.map((d) => d.income);
    const expenses = data.map((d) => d.expense);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    instanceRef.current.setOption({
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['收入', '支出'],
        bottom: 0,
        textStyle: { color: textColor, fontSize: 12 },
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
        axisLabel: { color: textColor, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLabel: {
          color: textColor,
          fontSize: 10,
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
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
        },
        {
          name: '支出',
          type: 'line',
          data: expenses,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#ef4444' },
        },
      ],
    });

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  // cleanup on unmount
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
        📈 月度趋势
      </h2>
      <div
        ref={chartRef}
        style={{
          height: '250px',
          width: '100%',
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid var(--border)',
        }}
      />
    </div>
  );
};

export default ReportMonthlyTrend;
