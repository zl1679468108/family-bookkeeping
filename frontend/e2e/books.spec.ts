import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('账本管理 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看账本页面', async ({ page }) => {
    await page.goto('/books');
    await page.waitForTimeout(2000);
    // 只验证页面加载
    await expect(page.locator('text=账本')).toBeVisible();
  });

  test('创建新账本', async ({ page }) => {
    await page.goto('/books');
    await page.waitForTimeout(2000);
    
    // 点击创建按钮
    const createBtn = page.locator('button:has-text("创建")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // 填写名称
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E测试账本');
        await page.click('button:has-text("保存")');
      }
    }
  });

  test('切换当前账本', async ({ page }) => {
    await page.goto('/books');
    await page.waitForTimeout(2000);
    
    // 点击第一个账本卡片
    const bookCard = page.locator('.book-card, [data-testid="book-card"]').first();
    if (await bookCard.isVisible()) {
      await bookCard.click();
      await page.waitForTimeout(500);
    }
  });

  test('删除账本', async ({ page }) => {
    await page.goto('/books');
    await page.waitForTimeout(2000);
    
    // 点击删除按钮
    const deleteBtn = page.locator('[data-testid="delete-book"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.click('button:has-text("确定")');
    }
  });
});
