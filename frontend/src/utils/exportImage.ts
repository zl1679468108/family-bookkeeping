import html2canvas from 'html2canvas';

/**
 * 使用 html2canvas 截取 DOM 元素生成长图并触发下载
 */
export async function captureLongImage(
  element: HTMLElement,
  filename: string = '年度报告.png',
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
