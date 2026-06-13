import { toPng } from 'html-to-image';

/**
 * 截取 DOM 元素生成长图并触发下载
 * 
 * 容器在 index.tsx 中已设置固定 672px 宽度 + minWidth + maxWidth + boxSizing: border-box。
 * 此处只需要确保 echarts 已绘制完成，然后直接导出。
 */
export async function captureLongImage(
  element: HTMLElement,
  filename: string = '年度报告.png',
): Promise<void> {
  // 保存原始 overflow
  const origOverflow = element.style.overflow;

  // 允许溢出（避免父容器裁切）
  element.style.overflow = 'visible';

  // 1. 收集所有 echarts 实例
  const echartsInstances: any[] = [];
  element.querySelectorAll('div').forEach((dom) => {
    const inst = (dom as any).__echarts_instance__;
    if (inst && typeof inst.resize === 'function') {
      echartsInstances.push(inst);
    }
  });

  // 2. 触发 echarts resize，让图表适配容器实际宽度（672px）
  echartsInstances.forEach((inst) => {
    try { inst.resize(); } catch (e) { /* ignore */ }
  });

  // 3. 等待浏览器布局 + echarts 绘制完成（约 500ms）
  await new Promise((r) => setTimeout(r, 500));

  try {
    // 4. html-to-image 按元素实际尺寸导出（元素固定 672px）
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
