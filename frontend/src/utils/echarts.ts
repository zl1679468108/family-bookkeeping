import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  PieChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

export { echarts };
export type { ECharts } from 'echarts/core';
export type EChartsOption = echarts.EChartsCoreOption;
