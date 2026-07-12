import { expect, test } from '@playwright/test';
import type { CapturedRequest } from './helpers';
import { findRequest, setupAuthenticatedPage } from './helpers';

test.describe('统计报表 - 查询数据与筛选联动', () => {
  let captured: CapturedRequest[];

  test.beforeEach(async ({ page }) => {
    captured = await setupAuthenticatedPage(page);
  });

  test('展示总收入、总支出、分类占比和趋势区域', async ({ page }) => {
    await page.goto('/#/reports');

    await expect(page.getByText('数据分析')).toBeVisible();
    await expect(page.getByText('总收入', { exact: true })).toBeVisible();
    await expect(page.getByText('总支出', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '分类占比' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '本月每日总支出/总收入' })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
    expect(findRequest(captured, 'GET', '/api/statistics/category-breakdown')).toBeTruthy();
    expect(findRequest(captured, 'GET', '/api/statistics/daily-summary')).toBeTruthy();
  });

  test('切换近 3 月会请求 monthly-trend 并更新图表标题', async ({ page }) => {
    await page.goto('/#/reports');

    const request = page.waitForRequest((req) => {
      const url = new URL(req.url());
      return req.method() === 'GET'
        && url.pathname.endsWith('/api/statistics/monthly-trend')
        && url.searchParams.get('months') === '3';
    });

    await page.locator('.dd-select__btn').filter({ hasText: '本月' }).click();
    await page.locator('.dd-select__item').filter({ hasText: '近 3 月' }).click();
    await request;

    await expect(page.getByText('月度总支出/总收入汇总')).toBeVisible();
  });

  test('成员对比 Tab 会在多成员账本下请求成员数据', async ({ page }) => {
    await page.goto('/#/reports');

    const request = page.waitForRequest((req) => {
      const url = new URL(req.url());
      return req.method() === 'GET' && url.pathname.endsWith('/api/statistics/member-comparison');
    });

    await page.getByRole('button', { name: '成员对比' }).click();
    await request;

    await expect(page.getByRole('heading', { name: /成员支出分布/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /分类对比/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /月度估算/ })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(3);
  });
});
