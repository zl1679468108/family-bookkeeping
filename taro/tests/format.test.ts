import { describe, it, expect } from '@jest/globals';
import { fmtAmount, fmtDate, fmtFriendlyDate } from '../src/utils/format';

describe('fmtAmount', () => {
  it('千位用 locale 分隔符', () => {
    expect(fmtAmount(9999)).toBe('9,999');
    expect(fmtAmount(1234)).toBe('1,234');
  });

  it('>=1万 显示为 X万', () => {
    expect(fmtAmount(10000)).toBe('1万');
    expect(fmtAmount(15000)).toBe('1.5万');
    expect(fmtAmount(20000)).toBe('2万');
    expect(fmtAmount(123456)).toBe('12.3万');
  });

  it('取绝对值（负数不显示负号）', () => {
    expect(fmtAmount(-15000)).toBe('1.5万');
  });
});

describe('fmtDate', () => {
  it('Date → YYYY-MM-DD 且补零', () => {
    expect(fmtDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(fmtDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('fmtFriendlyDate', () => {
  it('跨年日期返回完整年月日', () => {
    expect(fmtFriendlyDate('2020-01-15')).toBe('2020-01-15');
    expect(fmtFriendlyDate('2020-12-03')).toBe('2020-12-03');
  });

  it('今天返回 今天', () => {
    const t = new Date();
    const ds = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    expect(fmtFriendlyDate(ds)).toBe('今天');
  });

  it('昨天返回 昨天', () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const ds = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    expect(fmtFriendlyDate(ds)).toBe('昨天');
  });
});
