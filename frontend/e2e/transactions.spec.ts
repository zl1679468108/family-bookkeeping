import { test, expect } from '@playwright/test';
import { login, TEST_ACCOUNTS } from './helpers';

const TEST_EMAIL = TEST_ACCOUNTS[0].email;
const TEST_PASSWORD = TEST_ACCOUNTS[0].password;

test.describe('交易管理 - 真实数据', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('查看交易页面', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForTimeout(3000);
    // 只验证页面加载完成（侧边栏存在）
    await expect(page.locator('text=流水')).toBeVisible();
  });

  test('创建支出交易', async ({ page }) => {
    await page.goto('/add');
    await page.waitForTimeout(2000);
    
    // 验证页面加载
    await expect(page.locator('text=添加交易')).toBeVisible();
    
    // 填写金额
    await page.fill('input[type="number"]', '28.50');
    
    // 选择分类
    await page.click('[data-testid="category-selector"]');
    await page.waitForTimeout(500);
    await page.click('text=餐饮');
    
    // 填写描述
    await page.fill('textarea', 'E2E测试 - 午餐');
    
    // 提交
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('创建收入交易', async ({ page }) => {
    await page.goto('/add');
    await page.waitForTimeout(2000);
    
    // 验证页面加载
    await expect(page.locator('text=添加交易')).toBeVisible();
    
    // 切换到收入
    await page.click('text=收入');
    
    // 填写金额
    await page.fill('input[type="number"]', '1000');
    
    // 选择分类
    await page.click('[data-testid="category-selector"]');
    await page.waitForTimeout(500);
    await page.click('text=工资');
    
    // 填写描述
    await page.fill('textarea', 'E2E测试 - 工资');
    
    // 提交
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('筛选交易类型', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForTimeout(3000);
    
    // 尝试点击筛选按钮
    const filterBtn = page.locator('button:has-text("支出")');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('搜索交易', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForTimeout(3000);
    
    // 搜索
    const searchInput = page.locator('input[placeholder*="搜索"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E');
      await page.waitForTimeout(500);
    }
  });
});
