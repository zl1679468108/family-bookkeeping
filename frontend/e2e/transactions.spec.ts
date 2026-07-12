import { expect, test } from '@playwright/test';
import { expectObject, openCategoryDropdown, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('流水与记一笔 - UI、筛选、提交', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('流水列表展示查询数据，搜索和筛选会带查询参数', async ({ page }) => {
    await page.goto('/#/transactions');

    await expect(page.getByText('午餐')).toBeVisible();
    await expect(page.getByText('七月工资')).toBeVisible();
    await expect(page.getByText('本页3笔')).toBeVisible();

    const searchRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return request.method() === 'GET'
        && url.pathname.endsWith('/api/transactions')
        && url.searchParams.get('search') === '午餐';
    });
    await page.getByPlaceholder('搜索描述/品牌...').fill('午餐');
    await searchRequest;
    await expect(page.getByText('午餐')).toBeVisible();

    const filterRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return request.method() === 'GET'
        && url.pathname.endsWith('/api/transactions')
        && url.searchParams.get('type') === 'expense';
    });
    await page.locator('.dd-select__btn').filter({ hasText: '全部类型' }).click();
    await page.locator('.dd-select__item').filter({ hasText: '支出' }).click();
    await filterRequest;
  });

  test('新建支出交易会提交金额、分类、日期、品牌和备注', async ({ page }) => {
    await page.goto('/#/add');
    await expect(page.getByText('快捷方式')).toBeVisible();

    await page.locator('input[placeholder="0.00"]').fill('28.50');
    await openCategoryDropdown(page, '餐饮');
    await page.locator('input[placeholder*="雅诗兰黛"]').fill('社区食堂');
    await page.getByPlaceholder('例如：小棕瓶 50ml，给妈妈买的礼物').fill('E2E午餐');

    const payload = await waitForRequest(page, 'POST', '/api/transactions', async () => {
      await page.getByRole('button', { name: '确认添加' }).click();
    });
    const transaction = expectObject(payload);
    expect(transaction.amount).toBe(28.5);
    expect(transaction.category).toBe('cat-food');
    expect(transaction.type).toBe('expense');
    expect(transaction.brand).toBe('社区食堂');
    expect(transaction.description).toBe('E2E午餐');

    await expect(page).toHaveURL(/#\/transactions/);
  });

  test('新建收入交易会提交收入类型和工资分类', async ({ page }) => {
    await page.goto('/#/add');
    await page.getByRole('button', { name: '收入' }).click();
    await page.locator('input[placeholder="0.00"]').fill('1000');
    await openCategoryDropdown(page, '工资');
    await page.getByPlaceholder('例如：小棕瓶 50ml，给妈妈买的礼物').fill('E2E工资');

    const payload = await waitForRequest(page, 'POST', '/api/transactions', async () => {
      await page.getByRole('button', { name: '确认添加' }).click();
    });
    const transaction = expectObject(payload);
    expect(transaction.type).toBe('income');
    expect(transaction.category).toBe('cat-salary');
    expect(transaction.amount).toBe(1000);
  });

  test('详情弹窗支持删除交易并发起 DELETE 请求', async ({ page }) => {
    await page.goto('/#/transactions');
    await page.getByRole('button', { name: /查看交易详情：午餐/ }).click();
    await expect(page.getByText('交易详情')).toBeVisible();

    await waitForRequest(page, 'DELETE', '/api/transactions/101', async () => {
      await page.getByRole('button', { name: '删除' }).click();
      await page.getByRole('button', { name: '确认删除' }).click();
    });
  });
});
