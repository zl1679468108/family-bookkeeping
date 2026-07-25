import React, { useMemo, useRef, useEffect } from 'react';
import { echarts } from '../../utils/echarts';
import type { ECharts, EChartsOption } from '../../utils/echarts';
import { useMemberComparison } from '../../hooks/useMemberComparison';
import type { MemberComparisonItem } from '@family-bookkeeping/shared-types';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card, CardHeader } from '../../components/ui/Card';
import './MemberComparison.scss';
import { formatAmount } from '../../utils/common';
import { getChartPalette, getEchartsChrome } from '../../utils/themeColors'
import { useTheme } from '../../utils/theme'
import { formatMonthDisplayCompact, generateMonthKeysBetween } from '../../utils/month'
import { EMPTY_MEMBER_SPEND_PERIOD, EMPTY_LOAD_FAILED } from '../../utils/emptyCopy';
import { TITLE_MEMBER_SPEND, TITLE_CATEGORY_COMPARE, TITLE_MONTHLY_ESTIMATE, withPeriodLabel } from '../../utils/sectionCopy';
import { FIELD_RATIO } from '../../utils/fieldCopy'
import { formatErrorDescription } from '../../utils/errorMessage'

interface MemberComparisonProps {
  monthFrom: string;
  monthTo: string;
}

// 统一的扇形图渲染函数
const renderPieChart = (
  elRef: React.RefObject<HTMLDivElement>,
  instRef: React.MutableRefObject<ECharts | null>,
  data: { name: string; value: number }[],
) => {
  if (!elRef.current) return;

  if (instRef.current) {
    instRef.current.dispose();
    instRef.current = null;
  }
  instRef.current = echarts.init(elRef.current);

  const chrome = getEchartsChrome();
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      ...chrome.tooltip,
      formatter: (params: any) => {
        const v = params.value || 0;
        return `${params.name}<br/>金额：${formatAmount(v)}<br/>占比：${params.percent}%`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: chrome.legendText,
    },
    series: [
      {
        name: FIELD_RATIO,
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: chrome.pieBorder,
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          fontSize: 11,
          color: chrome.text,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: chrome.text,
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
  const chartInstance = useRef<ECharts | null>(null);
  const { resolvedTheme } = useTheme();
  const palette = useMemo(() => getChartPalette(), [resolvedTheme]);

  const pieData = useMemo(() => {
    return data.map((member, i) => ({
      name: member.user_name,
      value: member.total_expense,
      itemStyle: { color: palette[i % palette.length] },
    }));
  }, [data, palette]);

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
  }, [pieData, resolvedTheme]);

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
};

// 分类对比扇形图
const CategoryPieChart: React.FC<{ data: MemberComparisonItem[] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const { resolvedTheme } = useTheme();

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
  }, [allCategories, resolvedTheme]);

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
};

// 月度明细柱状图
const MonthlyBarChart: React.FC<{
  data: MemberComparisonItem[];
  monthFrom: string;
  monthTo: string;
}> = ({ data, monthFrom, monthTo }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const { resolvedTheme } = useTheme();
  const palette = useMemo(() => getChartPalette(), [resolvedTheme]);

  const months = useMemo(() => generateMonthKeysBetween(monthFrom, monthTo), [monthFrom, monthTo]);

  // T-H7: API 仅返回成员总支出（无月度细分），改为均分展示并标注「估算」
  const memberMonthData = useMemo(() => {
    return data.map((member, i) => {
      const monthlyAmount = member.total_expense / Math.max(months.length, 1);
      return {
        name: member.user_name,
        data: months.map(() => monthlyAmount),
        color: palette[i % palette.length],
      };
    });
  }, [data, months, palette]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
    chartInstance.current = echarts.init(chartRef.current);

    const chrome = getEchartsChrome();
    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        ...chrome.tooltip,
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
        data: months.map((m) => formatMonthDisplayCompact(m)),
        axisLabel: { ...chrome.axisLabel, fontSize: 11 },
        axisLine: chrome.axisLine,
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...chrome.axisLabel, formatter: (value: number) => formatAmount(value) },
        splitLine: chrome.splitLine,
        axisLine: { show: false },
      },
      legend: {
        data: memberMonthData.map((m) => m.name),
        top: 0,
        textStyle: chrome.legendText,
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
  }, [data, months, memberMonthData, resolvedTheme]);

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />;
};

export const MemberComparison: React.FC<MemberComparisonProps> = ({
  monthFrom,
  monthTo,
}) => {
  const { data = [], isLoading, error } = useMemberComparison(
    { month_from: monthFrom, month_to: monthTo },
  );

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
      <EmptyState
        icon="⚠️"
        description={formatErrorDescription(error, EMPTY_LOAD_FAILED)}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState description={EMPTY_MEMBER_SPEND_PERIOD} />
    );
  }

  const periodLabel = `${formatMonthDisplayCompact(monthFrom)} ~ ${formatMonthDisplayCompact(monthTo)}`;

  return (
    <div className="mc-container">
      {/* 第一行：成员支出分布 + 分类对比 并排 */}
      <div style={{ display: 'flex', gap: '14px' }}>
        <Card style={{ flex: 1 }}>
          <CardHeader title={withPeriodLabel(TITLE_MEMBER_SPEND, periodLabel)} />
          <MemberExpensePieChart data={data} />
        </Card>
        <Card style={{ flex: 1 }}>
          <CardHeader title={withPeriodLabel(TITLE_CATEGORY_COMPARE, periodLabel)} />
          <CategoryPieChart data={data} />
        </Card>
      </div>

      {/* 第二行：月度明细 */}
      <Card style={{ marginTop: '14px' }}>
        <CardHeader title={withPeriodLabel(TITLE_MONTHLY_ESTIMATE, periodLabel)} />
        <MonthlyBarChart data={data} monthFrom={monthFrom} monthTo={monthTo} />
      </Card>
    </div>
  );
};

export default MemberComparison;
