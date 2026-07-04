import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[2].email;
const TEST_PASSWORD = TEST_ACCOUNTS[2].password;

test.describe('统计报表 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看报表页面', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    // 验证页面加载
    await expect(page.locator('nav')).toBeVisible();
  });

  test('查看收支概览', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=收入')).toBeVisible();
    await expect(page.locator('text=支出')).toBeVisible();
  });

  test('查看图表', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await expect(page.locator('canvas, svg, .chart')).toBeVisible();
  });

  test('切换时间范围', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    
    const periodBtn = page.locator('[data-testid="period-selector"], button:has-text("月")');
    if (await periodBtn.isVisible()) {
      await periodBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('导出报表', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    
    const exportBtn = page.locator('button:has-text("导出")');
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(2000);
    }
  });
});
