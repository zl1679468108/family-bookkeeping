import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { MonthlyTrendItem, CategoryBreakdownItem } from '../../types/statistics';
import { expenseCategoryDict, incomeCategoryDict } from '../../utils/commonDic';
import './index.scss';

interface ChartCardProps {
  title: string;
  chartType: 'trend' | 'pie';
  data?: MonthlyTrendItem[] | CategoryBreakdownItem[];
  loading?: boolean;
  typeOptions?: { value: string; label: string }[];
  onTypeChange?: (value: string) => void;
  activeType?: string;
}

/** Build echarts option for trend line chart */
const buildTrendOption = (data: MonthlyTrendItem[]): EChartsOption => {
  const months = data.map((item) => item.month);
  const amounts = data.map((item) => item.amount);

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
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 12,
        formatter: (value: string) => {
          // Show only the month part (e.g. "2025-01" -> "01月")
          const parts = value.split('-');
          return parts.length === 2 ? `${parseInt(parts[1], 10)}月` : value;
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: {
        color: '#999',
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
          color: '#6366f1',
          width: 2,
        },
        itemStyle: {
          color: '#6366f1',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.24)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
            ],
          },
        },
      },
    ],
  };
};

/** Build echarts option for pie (doughnut) chart */
const buildPieOption = (data: CategoryBreakdownItem[]): EChartsOption => {
  const mergedDict = { ...expenseCategoryDict, ...incomeCategoryDict };

  const chartData = data.map((item) => {
    const catInfo = mergedDict[item.category as keyof typeof mergedDict];
    const label = catInfo ? `${catInfo.icon} ${catInfo.name}` : item.category;
    return {
      name: label,
      value: item.amount,
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `${p.name}<br/>金额: ¥${p.value.toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
        })} (${p.percent}%)`;
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
        color: '#666',
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
          borderColor: '#fff',
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
}) => {
  const option = useMemo(() => {
    if (!data || data.length === 0) return null;

    if (chartType === 'trend') {
      return buildTrendOption(data as MonthlyTrendItem[]);
    }
    return buildPieOption(data as CategoryBreakdownItem[]);
  }, [chartType, data]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onTypeChange) {
      onTypeChange(e.target.value);
    }
  };

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
