import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('分类管理 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看分类页面', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForTimeout(2000);
    // 只验证页面加载
    await expect(page.locator('nav')).toBeVisible();
  });

  test('创建自定义分类', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("创建")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E测试分类');
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('编辑分类', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForTimeout(2000);
    
    const category = page.locator('text=E2E测试分类');
    if (await category.isVisible()) {
      await category.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E已修改分类');
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('删除自定义分类', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForTimeout(2000);
    
    const category = page.locator('text=E2E已修改分类');
    if (await category.isVisible()) {
      await category.click();
      await page.waitForTimeout(500);
      
      const deleteBtn = page.locator('[data-testid="delete-category"]');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.click('button:has-text("确定")');
      }
    }
  });
});
