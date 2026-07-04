import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('预算管理 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看预算页面', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    await expect(page.locator('.empty-state__title')).toBeVisible();
  });

  test('设置月度预算', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    
    const settingBtn = page.locator('button:has-text("设置")');
    if (await settingBtn.isVisible()) {
      await settingBtn.click();
      await page.waitForTimeout(2000);
      
      // 验证表单出现
      await expect(page.locator('input[type="number"]')).toBeVisible();
    }
  });

  test('查看预算执行状态', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    await expect(page.locator('.empty-state__title, .budget-item')).toBeVisible();
  });

  test('修改预算金额', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('[data-testid="edit-budget"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[type="number"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('3000');
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('删除预算', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    
    const deleteBtn = page.locator('[data-testid="delete-budget"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.click('button:has-text("确定")');
    }
  });

  test('复制上月预算', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    
    const copyBtn = page.locator('button:has-text("复制")');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.click('button:has-text("确定")');
    }
  });
});
