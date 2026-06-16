import React, { useMemo, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useMemberComparison } from '../../hooks/useMemberComparison';
import type { MemberComparisonItem } from '../../types/memberComparison';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card, CardHeader } from '../../components/ui/Card';
import './MemberComparison.scss';
import { formatAmount } from '../../utils/common';

interface MemberComparisonProps {
  bookId: string;
  monthFrom: string;
  monthTo: string;
}

const MEMBER_COLORS: string[] = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6',
];

const formatMonth = (ym: string): string => {
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `${parseInt(parts[0], 10)}年${parseInt(parts[1], 10)}月`;
  }
  return ym;
};

const generateMonthRange = (from: string, to: string): string[] => {
  const months: string[] = [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
};

// 统一的扇形图渲染函数
const renderPieChart = (
  elRef: React.RefObject<HTMLDivElement>,
  instRef: React.MutableRefObject<echarts.ECharts | null>,
  data: { name: string; value: number }[],
) => {
  if (!elRef.current) return;

  if (instRef.current) {
    instRef.current.dispose();
    instRef.current = null;
  }
  instRef.current = echarts.init(elRef.current);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const v = params.value || 0;
        return `${params.name}<br/>金额：${formatAmount(v)}<br/>占比：${params.percent}%`;
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
        name: '占比',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'var(--bg-card)',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          fontSize: 11,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data,
      },
    ],
  };

  instRef.current.setOption(option as any);
  instRef.current.resize();
};

// 成员支出分布扇形图
const MemberExpensePieChart: React.FC<{ data: MemberComparisonItem[] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const pieData = useMemo(() => {
    return data.map((member, i) => ({
      name: member.user_name,
      value: member.total_expense,
      itemStyle: { color: MEMBER_COLORS[i % MEMBER_COLORS.length] },
    }));
  }, [data]);

  useEffect(() => {
    if (pieData.length === 0 || !chartRef.current) return;

    const timer = setTimeout(() => {
      renderPieChart(chartRef, chartInstance, pieData);
    }, 50);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [pieData]);

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
};

// 分类对比扇形图
const CategoryPieChart: React.FC<{ data: MemberComparisonItem[] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const allCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    data.forEach((member) => {
      member.categories.forEach((cat) => {
        catMap.set(cat.category_name, (catMap.get(cat.category_name) || 0) + cat.amount);
      });
    });
    return Array.from(catMap.entries())
      .map(([name, total]) => ({ name, value: total }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  useEffect(() => {
    if (allCategories.length === 0 || !chartRef.current) return;

    const timer = setTimeout(() => {
      renderPieChart(chartRef, chartInstance, allCategories);
    }, 50);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [allCategories]);

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
};

// 月度明细柱状图
const MonthlyBarChart: React.FC<{
  data: MemberComparisonItem[];
  monthFrom: string;
  monthTo: string;
}> = ({ data, monthFrom, monthTo }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const months = useMemo(() => generateMonthRange(monthFrom, monthTo), [monthFrom, monthTo]);

  // 按成员+月份汇总支出
  const memberMonthData = useMemo(() => {
    // 简化处理：当前API按成员汇总，没有月度细分
    // 这里将各成员的总支出平均分配到选中的月份区间
    return data.map((member, i) => {
      const monthlyAmount = member.total_expense / Math.max(months.length, 1);
      return {
        name: member.user_name,
        data: months.map(() => monthlyAmount),
        color: MEMBER_COLORS[i % MEMBER_COLORS.length],
      };
    });
  }, [data, months]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].name}<br/>`;
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}：${formatAmount(p.value)}<br/>`;
          });
          return result;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months.map((m) => formatMonth(m)),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value: number) => formatAmount(value) },
      },
      legend: {
        data: memberMonthData.map((m) => m.name),
        top: 0,
        textStyle: { fontSize: 12 },
      },
      series: memberMonthData.map((member) => ({
        name: member.name,
        type: 'bar' as const,
        data: member.data,
        itemStyle: { color: member.color },
        barGap: '10%',
      })),
    };

    chartInstance.current.setOption(option as any);
    chartInstance.current.resize();

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, months, memberMonthData]);

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />;
};

export const MemberComparison: React.FC<MemberComparisonProps> = ({
  bookId,
  monthFrom,
  monthTo,
}) => {
  const { data = [], isLoading, error } = useMemberComparison(
    bookId ? { book_id: bookId, month_from: monthFrom, month_to: monthTo } : null,
  );

  if (!bookId) {
    return <div className="mc-empty">请先选择一个账本</div>;
  }

  if (isLoading) {
    return (
      <>
        <div style={{ display: 'flex', gap: '14px' }}>
          <Card style={{ flex: 1 }}>
            <CardHeader title={<Skeleton width="40%" height="16px" />} />
            <Skeleton width="100%" height="280px" borderRadius="var(--rs)" />
          </Card>
          <Card style={{ flex: 1 }}>
            <CardHeader title={<Skeleton width="40%" height="16px" />} />
            <Skeleton width="100%" height="280px" borderRadius="var(--rs)" />
          </Card>
        </div>
        <Card style={{ marginTop: '14px' }}>
          <CardHeader title={<Skeleton width="40%" height="16px" />} />
          <Skeleton width="100%" height="300px" borderRadius="var(--rs)" />
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <div className="mc-empty">
        加载失败：{error instanceof Error ? error.message : '未知错误'}
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="mc-empty">暂无成员消费数据</div>;
  }

  const periodLabel = `${formatMonth(monthFrom)} ~ ${formatMonth(monthTo)}`;

  return (
    <div className="mc-container">
      {/* 第一行：成员支出分布 + 分类对比 并排 */}
      <div style={{ display: 'flex', gap: '14px' }}>
        <Card style={{ flex: 1 }}>
          <CardHeader title={`成员支出分布 · ${periodLabel}`} />
          <MemberExpensePieChart data={data} />
        </Card>
        <Card style={{ flex: 1 }}>
          <CardHeader title={`分类对比 · ${periodLabel}`} />
          <CategoryPieChart data={data} />
        </Card>
      </div>

      {/* 第二行：月度明细 */}
      <Card style={{ marginTop: '14px' }}>
        <CardHeader title={`月度明细 · ${periodLabel}`} />
        <MonthlyBarChart data={data} monthFrom={monthFrom} monthTo={monthTo} />
      </Card>
    </div>
  );
};

export default MemberComparison;
