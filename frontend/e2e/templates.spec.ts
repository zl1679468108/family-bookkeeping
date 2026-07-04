import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('模板管理 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看模板页面', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=模板')).toBeVisible();
  });

  test('创建交易模板', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("创建")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E午餐模板');
        
        const amountInput = page.locator('input[type="number"]');
        if (await amountInput.isVisible()) {
          await amountInput.fill('35');
        }
        
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('执行模板', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    
    const executeBtn = page.locator('[data-testid="execute-template"]').first();
    if (await executeBtn.isVisible()) {
      await executeBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('编辑模板', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('[data-testid="edit-template"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E已修改模板');
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('删除模板', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    
    const deleteBtn = page.locator('[data-testid="delete-template"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.click('button:has-text("确定")');
    }
  });
});
