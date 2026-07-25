import { expect, test } from '@playwright/test';
import { expectObject, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('预算管理 - 查询、编辑、提交', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示预算执行状态和分类进度', async ({ page }) => {
    await page.goto('/#/budgets');

    await expect(page.getByText('预算明细')).toBeVisible();
    await expect(page.locator('.list-card').filter({ hasText: '餐饮' })).toBeVisible();
    await expect(page.getByText(/剩余/).first()).toBeVisible();
  });

  test('修改单个预算后点击保存会提交整月预算数组', async ({ page }) => {
    await page.goto('/#/budgets');
    await page.locator('.list-card').filter({ hasText: '餐饮' }).click();
    await expect(page.getByText('预算详情')).toBeVisible();
    await page.getByRole('button', { name: '编辑预算' }).click();
    await page.locator('input[type="number"]').fill('1500');
    await page.getByRole('button', { name: '确定' }).click();

    const payload = await waitForRequest(page, 'PUT', '/api/budgets', async () => {
      await page.getByRole('button', { name: '保存' }).click();
    });
    const input = expectObject(payload);
    expect(typeof input.month).toBe('string');
    expect(input.budgets).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'cat-food', amount: 1500 }),
    ]));
  });

  test('清零预算确认后立即提交 amount=0', async ({ page }) => {
    await setupAuthenticatedPage(page);

    await page.goto('/#/budgets');
    await page.locator('.list-card').filter({ hasText: '餐饮' }).click();

    const payload = await waitForRequest(page, 'PUT', '/api/budgets', async () => {
      await page.getByRole('button', { name: '删除预算' }).click();
      await page.getByRole('button', { name: '确认删除' }).click();
    });
    const input = expectObject(payload);
    expect(input.budgets).toEqual([
      expect.objectContaining({ category: 'cat-food', amount: 0 }),
    ]);
  });
});
