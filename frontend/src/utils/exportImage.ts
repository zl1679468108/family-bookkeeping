import { toPng } from 'html-to-image';
import type { ECharts } from './echarts';

/**
 * 截取 DOM 元素生成长图并触发下载
 */
export async function captureLongImage(
  element: HTMLElement,
  filename: string = '年度报告.png',
): Promise<void> {
  const origOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  const echartsInstances: ECharts[] = [];
  element.querySelectorAll('div').forEach((dom) => {
    const inst = (dom as { __echarts_instance__?: ECharts }).__echarts_instance__;
    if (inst && typeof inst.resize === 'function') {
      echartsInstances.push(inst);
    }
  });

  echartsInstances.forEach((inst) => {
    try { inst.resize(); } catch (e) { /* ignore */ }
  });

  await new Promise((r) => setTimeout(r, 500));

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 1,
      quality: 1,
      cacheBust: true,
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    element.style.overflow = origOverflow;
  }
}
