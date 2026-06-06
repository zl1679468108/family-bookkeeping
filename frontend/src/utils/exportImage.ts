import { toPng } from 'html-to-image';

/**
 * 截取 DOM 元素生成长图并触发下载
 * 使用 html-to-image（SVG foreignObject），原生支持 oklch() 等现代 CSS
 */
export async function captureLongImage(
  element: HTMLElement,
  filename: string = '年度报告.png',
): Promise<void> {
  // 暂存原始样式，截图后恢复
  const orig = {
    overflow: element.style.overflow,
    maxWidth: element.style.maxWidth,
    width: element.style.width,
  };

  // 临时解除宽度限制，确保长图捕获完整内容
  element.style.overflow = 'visible';
  element.style.maxWidth = 'none';
  element.style.width = 'auto';

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      quality: 1,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    element.style.overflow = orig.overflow;
    element.style.maxWidth = orig.maxWidth;
    element.style.width = orig.width;
  }
}
