import { describe, it, expect } from '@jest/globals';
import { getCategoryBg } from '../src/utils/categoryColors';

describe('getCategoryBg', () => {
  it('支出类关键词 → bg-expense-bg', () => {
    expect(getCategoryBg('餐饮')).toBe('bg-expense-bg');
    expect(getCategoryBg('房租')).toBe('bg-expense-bg');
  });

  it('收入/其他类关键词 → bg-primary-bg', () => {
    expect(getCategoryBg('交通')).toBe('bg-primary-bg');
    expect(getCategoryBg('工资')).toBe('bg-primary-bg');
  });

  it('支持子串匹配', () => {
    expect(getCategoryBg('周末餐饮消费')).toBe('bg-expense-bg');
    expect(getCategoryBg('地铁出行')).toBe('bg-primary-bg');
  });

  it('未知分类回退 bg-subtle', () => {
    expect(getCategoryBg('某个不存在的分类')).toBe('bg-subtle');
    expect(getCategoryBg('')).toBe('bg-subtle');
  });
});
