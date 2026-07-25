import { expect, test } from '@playwright/test';
import { expectObject, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('分类管理 - UI 与 CRUD 请求', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示支出/收入分类并能切换标签', async ({ page }) => {
    await page.goto('/#/categories');

    await expect(page.getByText('分类管理')).toBeVisible();
    await expect(page.locator('.list-card').filter({ hasText: '餐饮' })).toBeVisible();

    await page.getByRole('button', { name: '收入' }).click();
    await expect(page.locator('.list-card').filter({ hasText: '工资' })).toBeVisible();
    await expect(page.locator('.list-card').filter({ hasText: '餐饮' })).toBeHidden();
  });

  test('新建分类会提交名称、图标和类型', async ({ page }) => {
    await page.goto('/#/categories');
    await page.getByRole('button', { name: '+ 新建分类' }).click();

    await expect(page.getByRole('dialog', { name: '新增支出分类' })).toBeVisible();
    await page.getByPlaceholder('输入分类名称').fill('E2E分类');

    const payload = await waitForRequest(page, 'POST', '/api/categories', async () => {
      await page.getByRole('button', { name: '确认' }).click();
    });
    const category = expectObject(payload);
    expect(category.name).toBe('E2E分类');
    expect(category.type).toBe('expense');
    expect(typeof category.icon).toBe('string');
  });

  test('编辑自定义分类会提交更新请求', async ({ page }) => {
    await page.goto('/#/categories');
    await page.locator('.list-card').filter({ hasText: '购物' }).click();
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.getByPlaceholder('输入分类名称').fill('E2E已修改分类');

    const payload = await waitForRequest(page, 'PUT', '/api/categories/cat-shopping', async () => {
      await page.getByRole('button', { name: '确认' }).click();
    });
    const category = expectObject(payload);
    expect(category.name).toBe('E2E已修改分类');
  });

  test('删除自定义分类会二次确认并发起 DELETE', async ({ page }) => {
    await page.goto('/#/categories');
    await page.locator('.list-card').filter({ hasText: '购物' }).click();

    await waitForRequest(page, 'DELETE', '/api/categories/cat-shopping', async () => {
      await page.getByRole('button', { name: '删除' }).click();
      await page.getByRole('button', { name: '确认删除' }).click();
    });
  });
});
