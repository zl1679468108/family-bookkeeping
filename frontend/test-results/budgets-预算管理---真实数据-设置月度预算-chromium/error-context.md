# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: budgets.spec.ts >> 预算管理 - 真实数据 >> 设置月度预算
- Location: e2e/budgets.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="number"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input[type="number"]')

```

```yaml
- complementary:
  - text: 静 静记
  - button "折叠":
    - img
  - navigation:
    - text: 主菜单
    - button "首页":
      - img
      - text: 首页
    - button "流水":
      - img
      - text: 流水
    - button "记一笔":
      - img
      - text: 记一笔
    - button "报表":
      - img
      - text: 报表
    - button "日历":
      - img
      - text: 日历
    - button "地图":
      - img
      - text: 地图
    - button "年报":
      - img
      - text: 年报
    - text: 更多
    - button "账本":
      - img
      - text: 账本
    - button "分类":
      - img
      - text: 分类
    - button "模板":
      - img
      - text: 模板
    - button "预算":
      - img
      - text: 预算
    - text: 管理后台
    - button "数据看板":
      - img
      - text: 数据看板
    - button "用户管理":
      - img
      - text: 用户管理
    - button "交易监控":
      - img
      - text: 交易监控
  - button "W wtt11":
    - text: W wtt11
    - img
- main:
  - heading "预算明细" [level=3]
  - button "2026 年 07 月 ▾"
  - button "保存"
  - text: ☕ 餐饮 ¥ 0.00 未设置预算 🛒 购物 ¥ 0.00 未设置预算
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, TEST_ACCOUNTS } from './helpers';
  3  | 
  4  | const TEST_EMAIL = TEST_ACCOUNTS[0].email;
  5  | const TEST_PASSWORD = TEST_ACCOUNTS[0].password;
  6  | 
  7  | test.describe('预算管理 - 真实数据', () => {
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await login(page, TEST_EMAIL, TEST_PASSWORD);
  10 |   });
  11 | 
  12 |   test('查看预算页面', async ({ page }) => {
  13 |     await page.goto('/budgets');
  14 |     await page.waitForTimeout(2000);
  15 |     await expect(page.locator('.empty-state__title')).toBeVisible();
  16 |   });
  17 | 
  18 |   test('设置月度预算', async ({ page }) => {
  19 |     await page.goto('/budgets');
  20 |     await page.waitForTimeout(2000);
  21 |     
  22 |     const settingBtn = page.locator('button:has-text("设置")');
  23 |     if (await settingBtn.isVisible()) {
  24 |       await settingBtn.click();
  25 |       await page.waitForTimeout(2000);
  26 |       
  27 |       // 验证表单出现
> 28 |       await expect(page.locator('input[type="number"]')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  29 |     }
  30 |   });
  31 | 
  32 |   test('查看预算执行状态', async ({ page }) => {
  33 |     await page.goto('/budgets');
  34 |     await page.waitForTimeout(2000);
  35 |     await expect(page.locator('.empty-state__title, .budget-item')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('修改预算金额', async ({ page }) => {
  39 |     await page.goto('/budgets');
  40 |     await page.waitForTimeout(2000);
  41 |     
  42 |     const editBtn = page.locator('[data-testid="edit-budget"]').first();
  43 |     if (await editBtn.isVisible()) {
  44 |       await editBtn.click();
  45 |       await page.waitForTimeout(1000);
  46 |       
  47 |       const amountInput = page.locator('input[type="number"]');
  48 |       if (await amountInput.isVisible()) {
  49 |         await amountInput.fill('3000');
  50 |         await page.click('button:has-text("保存")');
  51 |       }
  52 |     }
  53 |   });
  54 | 
  55 |   test('删除预算', async ({ page }) => {
  56 |     await page.goto('/budgets');
  57 |     await page.waitForTimeout(2000);
  58 |     
  59 |     const deleteBtn = page.locator('[data-testid="delete-budget"]').first();
  60 |     if (await deleteBtn.isVisible()) {
  61 |       await deleteBtn.click();
  62 |       await page.click('button:has-text("确定")');
  63 |     }
  64 |   });
  65 | 
  66 |   test('复制上月预算', async ({ page }) => {
  67 |     await page.goto('/budgets');
  68 |     await page.waitForTimeout(2000);
  69 |     
  70 |     const copyBtn = page.locator('button:has-text("复制")');
  71 |     if (await copyBtn.isVisible()) {
  72 |       await copyBtn.click();
  73 |       await page.click('button:has-text("确定")');
  74 |     }
  75 |   });
  76 | });
  77 | 
```