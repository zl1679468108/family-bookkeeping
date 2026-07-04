import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

test.describe('认证流程 - 真实账号', () => {
  test('账号1登录 (2029390286@qq.com)', async ({ page }) => {
    await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
    await expect(page.locator('text=首页')).toBeVisible();
    await expect(page.locator('text=wtt11')).toBeVisible();
  });

  test('账号2登录 (test123@qq.com)', async ({ page }) => {
    await login(page, TEST_ACCOUNTS[1].email, TEST_ACCOUNTS[1].password);
    await expect(page.locator('text=首页')).toBeVisible();
    await expect(page.locator('text=test123')).toBeVisible();
  });

  test('账号3登录 (1679468108@qq.com)', async ({ page }) => {
    await login(page, TEST_ACCOUNTS[2].email, TEST_ACCOUNTS[2].password);
    await expect(page.locator('text=首页')).toBeVisible();
    await expect(page.locator('text=zhaolong')).toBeVisible();
  });

  test('登录后显示用户信息', async ({ page }) => {
    await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${TEST_ACCOUNTS[0].username}`)).toBeVisible();
  });

  test('退出登录', async ({ page }) => {
    await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    // 点击退出登录
    const logoutBtn = page.locator('button:has-text("退出")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      
      // 确认退出
      const confirmBtn = page.locator('button:has-text("确定")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
