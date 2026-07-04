# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> 仪表板 - 真实数据 >> 点击查看报表跳转
- Location: e2e/dashboard.spec.ts:35:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: canvas, svg, text=收支
Expected: visible
Error: Unexpected token "=" while parsing css selector "canvas, svg, text=收支". Did you mean to CSS.escape it?

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for canvas, svg, text=收支

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: 静
      - generic [ref=e7]: 静记
    - button "折叠" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
    - navigation [ref=e11]:
      - generic [ref=e12]: 主菜单
      - button "首页" [ref=e13] [cursor=pointer]:
        - img [ref=e15]
        - generic [ref=e20]: 首页
      - button "流水" [ref=e21] [cursor=pointer]:
        - img [ref=e23]
        - generic [ref=e24]: 流水
      - button "记一笔" [ref=e25] [cursor=pointer]:
        - img [ref=e27]
        - generic [ref=e28]: 记一笔
      - button "报表" [ref=e29] [cursor=pointer]:
        - img [ref=e31]
        - generic [ref=e34]: 报表
      - button "日历" [ref=e35] [cursor=pointer]:
        - img [ref=e37]
        - generic [ref=e39]: 日历
      - button "地图" [ref=e40] [cursor=pointer]:
        - img [ref=e42]
        - generic [ref=e44]: 地图
      - button "年报" [ref=e45] [cursor=pointer]:
        - img [ref=e47]
        - generic [ref=e50]: 年报
      - generic [ref=e51]: 更多
      - button "账本" [ref=e52] [cursor=pointer]:
        - img [ref=e54]
        - generic [ref=e57]: 账本
      - button "分类" [ref=e58] [cursor=pointer]:
        - img [ref=e60]
        - generic [ref=e63]: 分类
      - button "模板" [ref=e64] [cursor=pointer]:
        - img [ref=e66]
        - generic [ref=e68]: 模板
      - button "预算" [ref=e69] [cursor=pointer]:
        - img [ref=e71]
        - generic [ref=e74]: 预算
      - generic [ref=e75]: 管理后台
      - button "数据看板" [ref=e76] [cursor=pointer]:
        - img [ref=e78]
        - generic [ref=e83]: 数据看板
      - button "用户管理" [ref=e84] [cursor=pointer]:
        - img [ref=e86]
        - generic [ref=e89]: 用户管理
      - button "交易监控" [ref=e90] [cursor=pointer]:
        - img [ref=e92]
        - generic [ref=e93]: 交易监控
    - button "W wtt11" [ref=e95] [cursor=pointer]:
      - generic [ref=e96]: W
      - generic [ref=e97]: wtt11
      - img [ref=e98]
  - main [ref=e100]:
    - generic [ref=e101]:
      - generic [ref=e102]:
        - button "数据分析" [ref=e103] [cursor=pointer]:
          - generic [ref=e104]: 数据分析
        - button "成员对比" [ref=e105] [cursor=pointer]:
          - generic [ref=e106]: 成员对比
      - button "本月 清空 ▾" [ref=e109] [cursor=pointer]:
        - generic [ref=e110]: 本月
        - button "清空" [ref=e111]:
          - img [ref=e112]
        - generic [ref=e115]: ▾
      - generic [ref=e117]:
        - generic [ref=e118]:
          - generic [ref=e119]: 总收入
          - generic [ref=e120]: ¥ 0.00
        - generic [ref=e121]:
          - generic [ref=e122]: 总支出
          - generic [ref=e123]: ¥ 0.00
      - generic [ref=e124]:
        - heading "分类占比" [level=3] [ref=e127]
        - generic [ref=e128]:
          - generic [ref=e129]: 📭
          - generic [ref=e130]: 暂无分类数据
          - generic [ref=e131]: 请等待数据加载或切换其他时间段
      - heading "本月每日总支出/总收入" [level=3] [ref=e135]
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
  32 |     await expect(page.locator('text=添加交易, text=记账')).toBeVisible();
  33 |   });
  34 | 
  35 |   test('点击查看报表跳转', async ({ page }) => {
  36 |     await page.click('h4:has-text("查看报表")');
  37 |     await page.waitForTimeout(3000);
  38 |     // 验证页面变化
> 39 |     await expect(page.locator('canvas, svg, text=收支')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  40 |   });
  41 | });
  42 | 
```