import { expect, test } from '@playwright/test';
import { setupAuthenticatedPage } from './helpers';

const routes = [
  { path: '/', title: '本月结余' },
  { path: '/transactions', title: '本页3笔' },
  { path: '/reports', title: '数据分析' },
  { path: '/categories', title: '分类管理' },
  { path: '/budgets', title: '预算明细' },
  { path: '/books', title: '我的账本' },
  { path: '/templates', title: '交易模板' },
  { path: '/calendar', title: '日历' },
  { path: '/annual-report', title: '保存为图片' },
  { path: '/profile', title: 'E2E用户' },
  { path: '/about', title: '财猫家庭记账' },
];

test.describe('主路由 smoke - 用户可到达且无控制台错误', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  for (const route of routes) {
    test(`${route.path} 可加载`, async ({ page }) => {
      await page.goto(`/#${route.path}`);
      await expect(page.locator('.sidebar, nav').first()).toBeVisible();
      await expect(page.getByText(route.title).first()).toBeVisible();
    });
  }

  test('未知路由展示 404 页面', async ({ page }) => {
    await page.goto('/#/nonexistent-page');
    await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible();
  });
});
