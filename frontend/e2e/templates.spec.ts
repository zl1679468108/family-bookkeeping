import { expect, test } from '@playwright/test';
import { chooseDropdownOption, expectObject, setupAuthenticatedPage, waitForRequest } from './helpers';

test.describe('模板管理 - UI 与提交', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('展示模板列表和模板详情', async ({ page }) => {
    await page.goto('/#/templates');

    await expect(page.getByText('交易模板')).toBeVisible();
    await page.locator('.tpl-card').filter({ hasText: '工作日午餐' }).click();
    await expect(page.getByText('模板详情')).toBeVisible();
    await expect(page.getByText('公司附近')).toBeVisible();
  });

  test('新建模板提交名称、类型、分类、金额和备注', async ({ page }) => {
    await page.goto('/#/templates');
    await page.getByRole('button', { name: '+ 新建模板' }).click();

    await page.getByPlaceholder('如：公司食堂午餐').fill('E2E午餐模板');
    await chooseDropdownOption(page, '选择分类', '餐饮');
    await page.locator('input[type="number"]').first().fill('35');
    await page.getByPlaceholder('添加备注（可选）').fill('固定午餐');

    const payload = await waitForRequest(page, 'POST', '/api/templates', async () => {
      await page.getByRole('button', { name: '创建' }).click();
    });
    const template = expectObject(payload);
    expect(template.name).toBe('E2E午餐模板');
    expect(template.type).toBe('expense');
    expect(template.category_id).toBe('cat-food');
    expect(template.amount).toBe(35);
    expect(template.note).toBe('固定午餐');
  });

  test('复制模板会打开预填表单，保存时发起 POST', async ({ page }) => {
    await page.goto('/#/templates');
    await page.locator('.tpl-card').filter({ hasText: '工作日午餐' }).click();
    await page.getByRole('button', { name: '复制' }).click();

    await expect(page.getByPlaceholder('如：公司食堂午餐')).toHaveValue('工作日午餐 (副本)');
    const payload = await waitForRequest(page, 'POST', '/api/templates', async () => {
      await page.getByRole('button', { name: '创建' }).click();
    });
    const template = expectObject(payload);
    expect(template.name).toBe('工作日午餐 (副本)');
  });

  test('删除模板会二次确认并发起 DELETE', async ({ page }) => {
    await page.goto('/#/templates');
    await page.locator('.tpl-card').filter({ hasText: '工作日午餐' }).click();

    await waitForRequest(page, 'DELETE', '/api/templates/tpl-lunch', async () => {
      await page.getByRole('button', { name: '删除' }).click();
      await page.getByRole('button', { name: '确认删除' }).click();
    });
  });
});
