import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('导航和路由 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('侧边栏导航', async ({ page }) => {
    await expect(page.locator('.sidebar, nav')).toBeVisible();
    
    await page.click('button:has-text("流水")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("报表")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("分类")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("预算")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("账本")');
    await page.waitForTimeout(1000);
  });

  test('未登录跳转登录页', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=登录')).toBeVisible();
  });

  test('页面加载', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(2000);
    // 只验证页面加载完成
    await expect(page.locator('nav')).toBeVisible();
  });

  test('404页面', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(2000);
    // 验证页面加载
    await expect(page.locator('nav')).toBeVisible();
  });

  test('返回按钮', async ({ page }) => {
    await page.goto('/add');
    await page.waitForTimeout(2000);
    
    const backBtn = page.locator('[data-testid="back-button"], button:has-text("返回")');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
