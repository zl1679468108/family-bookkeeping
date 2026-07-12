import { expect, test } from '@playwright/test';
import { expectObject, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('账本管理 - UI 与成员协作入口', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示账本列表和详情元数据', async ({ page }) => {
    await page.goto('/#/books');

    await expect(page.getByText('我的账本')).toBeVisible();
    await page.locator('.bk-card').filter({ hasText: '家庭账本' }).click();
    const dialog = page.getByRole('dialog', { name: '账本详情' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('日常家庭收支')).toBeVisible();
    await expect(dialog.getByText('2 人')).toBeVisible();
    await expect(dialog.getByText('12 笔')).toBeVisible();
    await expect(dialog.getByText('家庭成员')).toBeVisible();
  });

  test('创建账本提交名称、描述和图标', async ({ page }) => {
    await page.goto('/#/books');
    await page.getByRole('button', { name: '+ 新建账本' }).click();

    await page.getByPlaceholder('如：家庭账本').fill('E2E账本');
    await page.getByPlaceholder('简单介绍一下这个账本').fill('自动化测试创建');

    const payload = await waitForRequest(page, 'POST', '/api/books', async () => {
      await page.getByRole('button', { name: '创建账本' }).click();
    });
    const book = expectObject(payload);
    expect(book.name).toBe('E2E账本');
    expect(book.description).toBe('自动化测试创建');
    expect(typeof book.icon).toBe('string');
  });

  test('生成邀请码会调用邀请接口并展示邀请码', async ({ page }) => {
    await page.goto('/#/books');
    await page.locator('.bk-card').filter({ hasText: '家庭账本' }).click();

    await waitForRequest(page, 'POST', '/api/books/book-1/invitations', async () => {
      await page.getByRole('button', { name: '生成邀请码' }).click();
    });
    await expect(page.getByText('JJ2026')).toBeVisible();
  });

  test('切换账本会二次确认并提交当前账本 ID', async ({ page }) => {
    await page.goto('/#/books');
    await page.locator('.bk-card').filter({ hasText: '旅行账本' }).click();
    await page.getByRole('button', { name: '切换到此账本' }).click();

    const payload = await waitForRequest(page, 'PUT', '/api/auth/current-book', async () => {
      await page.getByRole('button', { name: '确认切换' }).click();
    });
    const input = expectObject(payload);
    expect(input.book_id).toBe('book-2');
  });
});
