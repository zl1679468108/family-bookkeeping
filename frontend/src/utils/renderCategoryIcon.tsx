import * as React from 'react';
import { getPlatformIconByKey } from './shoppingPlatformIcons';

/**
 * 根据 icon 值渲染正确的图标：
 * - URL (http/https) → <img>
 * - "platform_xxx" → 对应购物平台 SVG 图标
 * - 其他 → 按 emoji/纯文本渲染
 */
export const renderCategoryIcon = (
  icon: string | undefined,
  options: { size?: number; className?: string } = {},
): React.ReactNode => {
  if (!icon) return null;

  const { size = 20, className = '' } = options;

  // 1. URL → img 渲染
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return (
      <img
        src={icon}
        alt=""
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
    );
  }

  // 2. platform_xxx → 购物平台 SVG
  if (icon.startsWith('platform_')) {
    const key = icon.replace('platform_', '');
    const svg = getPlatformIconByKey(key);
    if (svg) return svg;
    return '📌';
  }

  // 3. 默认：emoji / 纯文本
  return <span style={{ fontSize: size }}>{icon}</span>;
};
