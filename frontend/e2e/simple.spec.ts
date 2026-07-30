import { expect, test } from '@playwright/test';
import { installApiMocks } from './helpers';

test('应用文档标题正确', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/#/login');
  await expect(page).toHaveTitle(/登录 - 财猫家庭记账/);
});
