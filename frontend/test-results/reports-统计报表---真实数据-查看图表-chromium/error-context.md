# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reports.spec.ts >> 统计报表 - 真实数据 >> 查看图表
- Location: e2e/reports.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('canvas, svg, .chart')
Expected: visible
Error: strict mode violation: locator('canvas, svg, .chart') resolved to 20 elements:
    1) <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">…</svg> aka getByRole('button', { name: '折叠' })
    2) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '首页' })
    3) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">…</svg> aka getByRole('button', { name: '流水' })
    4) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '记一笔' })
    5) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '报表' })
    6) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '日历' })
    7) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '地图' })
    8) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '年报' })
    9) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '账本' })
    10) <svg width="16" height="16" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">…</svg> aka getByRole('button', { name: '分类' })
    ...

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('canvas, svg, .chart')

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
    - button "zhaolong" [ref=e95] [cursor=pointer]:
      - generic [ref=e97]: zhaolong
      - img [ref=e98]
  - main [ref=e100]:
    - generic [ref=e101]:
      - generic [ref=e102]:
        - generic [ref=e103]:
          - generic [ref=e104]: 本月结余
          - generic [ref=e105]: ¥ 0.00
          - generic [ref=e106]: 共 0 笔
        - generic [ref=e107]:
          - img [ref=e110]
          - generic [ref=e112]: 本月收入
          - generic [ref=e113]: ¥ 0.00
          - generic [ref=e114]: 0 笔
        - generic [ref=e115]:
          - img [ref=e118]
          - generic [ref=e120]: 本月支出
          - generic [ref=e121]: ¥ 0.00
          - generic [ref=e122]: 0 笔
      - generic [ref=e123]:
        - generic [ref=e124]:
          - heading "本月最近交易" [level=3] [ref=e127]
          - generic [ref=e128]:
            - generic [ref=e129]: 📭
            - generic [ref=e130]: 暂无交易记录
            - button "添加第一笔交易" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: 添加第一笔交易
        - generic [ref=e135]:
          - generic [ref=e136]: 📊
          - generic [ref=e137]: 暂无预算设置
          - generic [ref=e138]: 设置预算可以更好地控制支出
          - button "去设置" [ref=e140] [cursor=pointer]:
            - generic [ref=e141]: 去设置
      - generic [ref=e142]:
        - generic [ref=e143] [cursor=pointer]:
          - img [ref=e145]
          - generic [ref=e146]:
            - heading "记一笔" [level=4] [ref=e147]
            - paragraph [ref=e148]: 快速记录一笔新交易
        - generic [ref=e149] [cursor=pointer]:
          - img [ref=e151]
          - generic [ref=e152]:
            - heading "查看报表" [level=4] [ref=e153]
            - paragraph [ref=e154]: 分析消费趋势与分类
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, TEST_ACCOUNTS } from './helpers';
  3  | 
  4  | const TEST_EMAIL = TEST_ACCOUNTS[2].email;
  5  | const TEST_PASSWORD = TEST_ACCOUNTS[2].password;
  6  | 
  7  | test.describe('统计报表 - 真实数据', () => {
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await login(page, TEST_EMAIL, TEST_PASSWORD);
  10 |   });
  11 | 
  12 |   test('查看报表页面', async ({ page }) => {
  13 |     await page.goto('/reports');
  14 |     await page.waitForTimeout(3000);
  15 |     // 验证页面加载
  16 |     await expect(page.locator('nav')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('查看收支概览', async ({ page }) => {
  20 |     await page.goto('/reports');
  21 |     await page.waitForTimeout(3000);
  22 |     await expect(page.locator('text=收入')).toBeVisible();
  23 |     await expect(page.locator('text=支出')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('查看图表', async ({ page }) => {
  27 |     await page.goto('/reports');
  28 |     await page.waitForTimeout(3000);
> 29 |     await expect(page.locator('canvas, svg, .chart')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  30 |   });
  31 | 
  32 |   test('切换时间范围', async ({ page }) => {
  33 |     await page.goto('/reports');
  34 |     await page.waitForTimeout(3000);
  35 |     
  36 |     const periodBtn = page.locator('[data-testid="period-selector"], button:has-text("月")');
  37 |     if (await periodBtn.isVisible()) {
  38 |       await periodBtn.click();
  39 |       await page.waitForTimeout(1000);
  40 |     }
  41 |   });
  42 | 
  43 |   test('导出报表', async ({ page }) => {
  44 |     await page.goto('/reports');
  45 |     await page.waitForTimeout(3000);
  46 |     
  47 |     const exportBtn = page.locator('button:has-text("导出")');
  48 |     if (await exportBtn.isVisible()) {
  49 |       await exportBtn.click();
  50 |       await page.waitForTimeout(2000);
  51 |     }
  52 |   });
  53 | });
  54 | 
```