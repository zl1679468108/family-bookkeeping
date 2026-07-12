import { expect, test } from '@playwright/test';
import { expectObject, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('预算管理 - 查询、编辑、提交', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示预算执行状态和分类进度', async ({ page }) => {
    await page.goto('/#/budgets');

    await expect(page.getByText('预算明细')).toBeVisible();
    await expect(page.locator('.budget-item').filter({ hasText: '餐饮' })).toBeVisible();
    await expect(page.getByText(/剩余/).first()).toBeVisible();
  });

  test('修改单个预算后点击保存会提交整月预算数组', async ({ page }) => {
    await page.goto('/#/budgets');
    await page.locator('.budget-item').filter({ hasText: '餐饮' }).click();
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

  test('清零预算后直接保存会提示至少设置一个预算，不发起提交', async ({ page }) => {
    const captured = await setupAuthenticatedPage(page);

    await page.goto('/#/budgets');
    await page.locator('.budget-item').filter({ hasText: '餐饮' }).click();
    await page.getByRole('button', { name: '删除预算' }).click();
    await page.getByRole('button', { name: '确认删除' }).click();
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByText('请至少设置一个分类的预算金额')).toBeVisible();
    expect(captured.some((entry) => entry.method === 'PUT' && entry.pathname.endsWith('/api/budgets'))).toBe(false);
  });
});
