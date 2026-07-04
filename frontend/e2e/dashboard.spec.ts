import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('仪表板 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('显示首页内容', async ({ page }) => {
    await expect(page.locator('text=首页')).toBeVisible();
    await expect(page.locator('text=本月结余')).toBeVisible();
    await expect(page.locator('text=本月收入')).toBeVisible();
    await expect(page.locator('text=本月支出')).toBeVisible();
  });

  test('显示最近交易', async ({ page }) => {
    await expect(page.locator('text=本月最近交易')).toBeVisible();
  });

  test('快捷操作按钮', async ({ page }) => {
    await expect(page.locator('h4:has-text("记一笔")')).toBeVisible();
    await expect(page.locator('h4:has-text("查看报表")')).toBeVisible();
  });

  test('点击记一笔跳转', async ({ page }) => {
    await page.click('h4:has-text("记一笔")');
    await page.waitForTimeout(3000);
    // 验证页面变化
    await expect(page.locator('text=添加交易, text=记账')).toBeVisible();
  });

  test('点击查看报表跳转', async ({ page }) => {
    await page.click('h4:has-text("查看报表")');
    await page.waitForTimeout(3000);
    // 验证页面变化
    await expect(page.locator('canvas, svg, text=收支')).toBeVisible();
  });
});
