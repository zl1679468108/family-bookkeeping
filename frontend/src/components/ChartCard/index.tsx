import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { MonthlyTrendItem, CategoryBreakdownItem } from '../../types/statistics';
import { useCategoryLookup } from '../../hooks/useCategories';
import { useTheme } from '../../utils/theme';
import './index.scss';

interface ChartCardProps {
  title: string;
  chartType: 'trend' | 'pie';
  data?: MonthlyTrendItem[] | CategoryBreakdownItem[];
  loading?: boolean;
  typeOptions?: { value: string; label: string }[];
  onTypeChange?: (value: string) => void;
  activeType?: string;
  onCategoryClick?: (category: string) => void;
}

/** Build echarts option for trend line chart */
const buildTrendOption = (data: MonthlyTrendItem[], isDark: boolean): EChartsOption => {
  const months = data.map((item) => item.month);
  const amounts = data.map((item) => item.amount);
  const axisColor = isDark ? '#888' : '#999';
  const splitLineColor = isDark ? '#333' : '#f0f0f0';
  const lineColor = isDark ? '#818cf8' : '#6366f1';
  const areaTopColor = isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.24)';
  const areaBotColor = isDark ? 'rgba(129, 140, 248, 0.01)' : 'rgba(99, 102, 241, 0.02)';

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number }[];
        if (!p || p.length === 0) return '';
        return `${p[0].name}<br/>金额: ¥${p[0].value.toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
        })}`;
      },
    },
    grid: {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: splitLineColor } },
      axisTick: { show: false },
      axisLabel: {
        color: axisColor,
        fontSize: 12,
        formatter: (value: string) => {
          const parts = value.split('-');
          return parts.length === 2 ? `${parseInt(parts[1], 10)}月` : value;
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: {
        color: axisColor,
        fontSize: 12,
        formatter: (value: number) => `¥${value.toLocaleString('zh-CN')}`,
      },
    },
    series: [
      {
        type: 'line',
        data: amounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: lineColor,
          width: 2,
        },
        itemStyle: {
          color: lineColor,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: areaTopColor },
              { offset: 1, color: areaBotColor },
            ],
          },
        },
      },
    ],
  };
};

/** Build echarts option for pie (doughnut) chart */
const buildPieOption = (data: CategoryBreakdownItem[], getCategoryName: (v: string) => string, getCategoryIcon: (v: string) => string, isDark: boolean): EChartsOption => {
  const chartData = data.map((item) => ({
    name: `${getCategoryIcon(item.category)} ${getCategoryName(item.category)}`,
    value: item.amount,
    categoryKey: item.category,
  }));

  const legendColor = isDark ? '#aaa' : '#666';
  const borderColor = isDark ? '#2a2a2a' : '#fff';

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `${p.name}<br/>金额: ¥${p.value.toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
        })} (${p.percent}%)<br/><span style="color:var(--accent);font-size:11px;">点击查看明细</span>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 12,
        color: legendColor,
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['40%', '50%'],
        data: chartData,
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        label: {
          show: false,
        },
        itemStyle: {
          borderColor: borderColor,
          borderWidth: 2,
        },
      },
    ],
  };
};

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  chartType,
  data,
  loading = false,
  typeOptions,
  onTypeChange,
  activeType,
  onCategoryClick,
}) => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (!data || data.length === 0) return null;

    if (chartType === 'trend') {
      return buildTrendOption(data as MonthlyTrendItem[], isDark);
    }
    return buildPieOption(data as CategoryBreakdownItem[], getCategoryName, getCategoryIcon, isDark);
  }, [chartType, data, getCategoryName, getCategoryIcon, isDark]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onTypeChange) {
      onTypeChange(e.target.value);
    }
  };

  /** Pie chart click handler for category drill-down */
  const handlePieClick = (params: any) => {
    if (chartType !== 'pie' || !onCategoryClick) return;
    if (!params?.data?.categoryKey) return;
    if (params.data.categoryKey === 'other') return;
    onCategoryClick(params.data.categoryKey);
  };

  const pieEvents = useMemo(() => {
    if (chartType !== 'pie' || !onCategoryClick) return undefined;
    return { click: handlePieClick };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, onCategoryClick]);

  const renderBody = () => {
    if (loading) {
      return <div className="chart-loading">加载中...</div>;
    }

    if (!data || data.length === 0) {
      return <div className="chart-empty">暂无数据</div>;
    }

    return (
      <div className="chart-body">
        <ReactECharts
          option={option!}
          style={{ width: '100%', height: '240px' }}
          opts={{ renderer: 'canvas' }}
          onEvents={pieEvents}
        />
      </div>
    );
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {typeOptions && typeOptions.length > 0 && (
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 32px 6px 12px' }}
            value={activeType ?? typeOptions[0]?.value}
            onChange={handleTypeChange}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {renderBody()}
    </div>
  );
};
