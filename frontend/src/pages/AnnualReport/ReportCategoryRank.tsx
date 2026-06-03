import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface CategoryItem {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

interface ReportCategoryRankProps {
  data: CategoryItem[];
}

/**
 * 支出分类排名 - ECharts 环形图
 */
export const ReportCategoryRank: React.FC<ReportCategoryRankProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }

    const isDark = document.documentElement.classList.contains('dark');

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    instanceRef.current.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11,
        },
      },
      series: [
        {
          name: '支出分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: data.map((item, i) => ({
            value: item.amount,
            name: `${item.category_icon || ''} ${item.category_name}`,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
      graphic: [
        {
          type: 'text',
          left: '29%',
          top: 'center',
          style: {
            text: '支出\n分类',
            textAlign: 'center',
            fill: isDark ? '#9ca3af' : '#6b7280',
            fontSize: 13,
            lineHeight: 20,
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
        🏷️ 支出分类 TOP5
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

export default ReportCategoryRank;
