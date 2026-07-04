# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> 仪表板 - 真实数据 >> 点击记一笔跳转
- Location: e2e/dashboard.spec.ts:28:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=添加交易, text=记账')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=添加交易, text=记账')

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
  - button "支出"
  - button "收入"
  - text: "*金额"
  - textbox "0.00"
  - text: "*分类"
  - button "* 分类 选择分类 ▾"
  - text: "*日期"
  - textbox: 2026-07-04
  - text: 品牌
  - textbox "例如：雅诗兰黛、苹果"
  - text: 备注
  - textbox "例如：小棕瓶 50ml，给妈妈买的礼物"
  - text: 0 / 500 附件 (0 / 10) + 添加图片
  - button "选择地点"
  - button "确认添加"
  - button "重置"
  - heading "快捷方式" [level=4]
  - text: 📋 选择模板 一键填充表单 📷 OCR识别 拍照识别票据
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, TEST_ACCOUNTS } from './helpers';
  3  | 
  4  | const TEST_EMAIL = TEST_ACCOUNTS[0].email;
  5  | const TEST_PASSWORD = TEST_ACCOUNTS[0].password;
  6  | 
  7  | test.describe('仪表板 - 真实数据', () => {
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await login(page, TEST_EMAIL, TEST_PASSWORD);
  10 |   });
  11 | 
  12 |   test('显示首页内容', async ({ page }) => {
  13 |     await expect(page.locator('text=首页')).toBeVisible();
  14 |     await expect(page.locator('text=本月结余')).toBeVisible();
  15 |     await expect(page.locator('text=本月收入')).toBeVisible();
  16 |     await expect(page.locator('text=本月支出')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('显示最近交易', async ({ page }) => {
  20 |     await expect(page.locator('text=本月最近交易')).toBeVisible();
  21 |   });
  22 | 
  23 |   test('快捷操作按钮', async ({ page }) => {
  24 |     await expect(page.locator('h4:has-text("记一笔")')).toBeVisible();
  25 |     await expect(page.locator('h4:has-text("查看报表")')).toBeVisible();
  26 |   });
  27 | 
  28 |   test('点击记一笔跳转', async ({ page }) => {
  29 |     await page.click('h4:has-text("记一笔")');
  30 |     await page.waitForTimeout(3000);
  31 |     // 验证页面变化
> 32 |     await expect(page.locator('text=添加交易, text=记账')).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  33 |   });
  34 | 
  35 |   test('点击查看报表跳转', async ({ page }) => {
  36 |     await page.click('h4:has-text("查看报表")');
  37 |     await page.waitForTimeout(3000);
  38 |     // 验证页面变化
  39 |     await expect(page.locator('canvas, svg, text=收支')).toBeVisible();
  40 |   });
  41 | });
  42 | 
```