import { expect, test } from '@playwright/test';
import { expectAppReady, setupAuthenticatedPage } from './helpers';

test.describe('仪表板 - 查询数据与快捷入口', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示本月概览、最近交易、预算进度', async ({ page }) => {
    await page.goto('/#/');
    await expectAppReady(page);

    await expect(page.getByText('本月结余')).toBeVisible();
    await expect(page.getByText('本月收入')).toBeVisible();
    await expect(page.getByText('本月支出')).toBeVisible();
    await expect(page.getByText('本月最近交易')).toBeVisible();
    await expect(page.getByText('午餐')).toBeVisible();
    await expect(page.getByText('本月预算')).toBeVisible();
    await expect(page.getByText(/餐饮/).first()).toBeVisible();
  });

  test('点击最近交易进入流水详情', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByText('午餐')).toBeVisible();

    await page.getByText('午餐').click();

    await expect(page).toHaveURL(/#\/transactions\?focus=101/);
    await expect(page.getByRole('button', { name: /查看交易详情：午餐/ })).toBeVisible();
    await page.getByRole('button', { name: /查看交易详情：午餐/ }).click();
    const dialog = page.getByRole('dialog', { name: '交易详情' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('社区食堂')).toBeVisible();
  });

  test('空态快捷按钮进入记一笔', async ({ page }) => {
    await page.route('http://localhost:3000/api/transactions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'ok', data: { data: [], total: 0, page: 1, pageSize: 5 } }),
      });
    });

    await page.goto('/#/');
    await expect(page.getByText('暂无交易记录')).toBeVisible();
    await page.getByRole('button', { name: '添加第一笔交易' }).click();

    await expect(page).toHaveURL(/#\/add\?type=expense/);
    await expect(page.getByText('快捷方式')).toBeVisible();
  });
});
