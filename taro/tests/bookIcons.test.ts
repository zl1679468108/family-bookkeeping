import { describe, it, expect } from '@jest/globals';
import {
  BOOK_ICONS,
  isCustomIconUrl,
  isBookIconKey,
  getBookIconSpecByKey,
  buildBookIconSvgString,
  getBookIconSvgDataUrl,
  renderBookIconSvg,
} from '../src/utils/bookIcons';

describe('BOOK_ICONS', () => {
  it('含 16 个图标，含 default', () => {
    expect(BOOK_ICONS.length).toBe(16);
    expect(BOOK_ICONS.some((i) => i.key === 'default')).toBe(true);
  });
});

describe('isCustomIconUrl', () => {
  it('识别 http(s) 链接', () => {
    expect(isCustomIconUrl('https://x.com/a.png')).toBe(true);
    expect(isCustomIconUrl('http://x.com/a')).toBe(true);
  });

  it('非链接返回 false', () => {
    expect(isCustomIconUrl('home')).toBe(false);
    expect(isCustomIconUrl(undefined)).toBe(false);
    expect(isCustomIconUrl('')).toBe(false);
  });
});

describe('isBookIconKey', () => {
  it('已定义 key 返回 true', () => {
    expect(isBookIconKey('home')).toBe(true);
    expect(isBookIconKey('family')).toBe(true);
  });

  it('未知/空返回 false', () => {
    expect(isBookIconKey('NOPE')).toBe(false);
    expect(isBookIconKey(undefined)).toBe(false);
  });
});

describe('getBookIconSpecByKey', () => {
  it('未知/空 key 回退 default 规格', () => {
    const def = getBookIconSpecByKey('default');
    expect(getBookIconSpecByKey(undefined)).toBe(def);
    expect(getBookIconSpecByKey('ghost')).toBe(def);
    expect(def.children.length).toBeGreaterThan(0);
  });

  it('已知 key 返回对应规格', () => {
    const home = getBookIconSpecByKey('home');
    expect(home.viewBox).toBe('0 0 24 24');
    expect(home.children.length).toBe(2);
  });
});

describe('buildBookIconSvgString', () => {
  it('生成含 stroke 颜色的合法 svg', () => {
    const svg = buildBookIconSvgString('home', '#2D9D8A');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('stroke="#2D9D8A"');
    expect(svg).toContain('</svg>');
  });

  it('默认颜色使用浅色主题前景令牌', () => {
    expect(buildBookIconSvgString('home')).toContain('stroke="#1A1C19"');
  });
});

describe('getBookIconSvgDataUrl / renderBookIconSvg', () => {
  it('getBookIconSvgDataUrl 返回 data URL', () => {
    expect(getBookIconSvgDataUrl('home').startsWith('data:image/svg+xml')).toBe(true);
  });

  it('renderBookIconSvg 为 getBookIconSvgDataUrl 的别名', () => {
    expect(renderBookIconSvg('home')).toBe(getBookIconSvgDataUrl('home'));
  });
});
