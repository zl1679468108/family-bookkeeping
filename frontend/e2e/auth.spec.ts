import { expect, test } from '@playwright/test';
import { expectAppReady, expectObject, installApiMocks, mockUser, setupAuthenticatedPage, TEST_TOKEN } from './helpers';

test.describe('认证与路由守卫 - 用户视角', () => {
  test('未登录访问私有页会跳转登录页', async ({ page }) => {
    await installApiMocks(page);

    await page.goto('/#/transactions');

    await expect(page.getByRole('heading', { name: '登录账户' })).toBeVisible();
    await expect(page.getByLabel('邮箱地址')).toBeVisible();
    await expect(page.getByLabel('密码')).toBeVisible();
  });

  test('登录表单提交账号、密码、验证码并进入首页', async ({ page }) => {
    const captured = await installApiMocks(page);

    await page.goto('/#/login');
    await page.getByLabel('邮箱地址').fill(mockUser.email);
    await page.getByLabel('密码').fill('mock-password');
    await page.getByLabel('验证码').fill('1234');
    await page.getByRole('button', { name: '登 录' }).click();

    await expectAppReady(page);
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.evaluate(() => window.localStorage.getItem('auth_token'))).resolves.toBe(TEST_TOKEN);

    const loginRequest = captured.find((entry) => entry.method === 'POST' && entry.pathname.endsWith('/auth/login'));
    const payload = expectObject(loginRequest?.postData);
    expect(payload.email).toBe(mockUser.email);
    expect(payload.password).toBe('mock-password');
    expect(payload.captchaCode).toBe('1234');
  });

  test('退出登录会清理本地 token 并回到登录页', async ({ page }) => {
    await setupAuthenticatedPage(page);

    await page.goto('/#/profile');
    await expectAppReady(page);
    await page.getByRole('button', { name: /E2E用户/ }).click();
    await page.getByRole('button', { name: '退出登录' }).click();

    await expect(page.getByRole('heading', { name: '登录账户' })).toBeVisible();
    await expect(page.evaluate(() => window.localStorage.getItem('auth_token'))).resolves.toBeNull();
  });
});
