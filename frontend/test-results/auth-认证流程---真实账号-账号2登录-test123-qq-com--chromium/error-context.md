# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> 认证流程 - 真实账号 >> 账号2登录 (test123@qq.com)
- Location: e2e/auth.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=首页')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=首页')

```

```yaml
- main:
  - text: 📒
  - heading "欢迎来到静记" [level=1]
  - paragraph: 创建属于你自己的账本，或通过邀请码加入他人的账本
  - button "📖 我自己创建账本 新建一个空账本，开始记录收支 →"
  - button "✉️ 使用邀请码加入 输入他人分享的邀请码，加入已有账本 →"
  - button "退出登录":
    - img
    - text: 退出登录
  - dialog "创建账本":
    - heading "创建账本" [level=3]
    - button "关闭": ✕
    - text: "*账本名称"
    - textbox "*账本名称":
      - /placeholder: 如：家庭账本
    - text: 描述（可选）
    - textbox "描述（可选）":
      - /placeholder: 简单介绍一下这个账本
    - text: 图标
    - button "账本":
      - img
      - text: 账本
    - button "居家":
      - img
      - text: 居家
    - button "工作":
      - img
      - text: 工作
    - button "学习":
      - img
      - text: 学习
    - button "娱乐":
      - img
      - text: 娱乐
    - button "健康":
      - img
      - text: 健康
    - button "旅行":
      - img
      - text: 旅行
    - button "餐饮":
      - img
      - text: 餐饮
    - button "购物":
      - img
      - text: 购物
    - button "运动":
      - img
      - text: 运动
    - button "社交":
      - img
      - text: 社交
    - button "家庭":
      - img
      - text: 家庭
    - button "宠物":
      - img
      - text: 宠物
    - button "交通":
      - img
      - text: 交通
    - button "投资":
      - img
      - text: 投资
    - button "礼物":
      - img
      - text: 礼物
    - text: 自定义图标
    - button "➕ 上传"
    - button "取消"
    - button "创建账本" [disabled]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, TEST_ACCOUNTS } from './helpers';
  3  | 
  4  | test.describe('认证流程 - 真实账号', () => {
  5  |   test('账号1登录 (2029390286@qq.com)', async ({ page }) => {
  6  |     await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
  7  |     await expect(page.locator('text=首页')).toBeVisible();
  8  |     await expect(page.locator('text=wtt11')).toBeVisible();
  9  |   });
  10 | 
  11 |   test('账号2登录 (test123@qq.com)', async ({ page }) => {
  12 |     await login(page, TEST_ACCOUNTS[1].email, TEST_ACCOUNTS[1].password);
> 13 |     await expect(page.locator('text=首页')).toBeVisible();
     |                                           ^ Error: expect(locator).toBeVisible() failed
  14 |     await expect(page.locator('text=test123')).toBeVisible();
  15 |   });
  16 | 
  17 |   test('账号3登录 (1679468108@qq.com)', async ({ page }) => {
  18 |     await login(page, TEST_ACCOUNTS[2].email, TEST_ACCOUNTS[2].password);
  19 |     await expect(page.locator('text=首页')).toBeVisible();
  20 |     await expect(page.locator('text=zhaolong')).toBeVisible();
  21 |   });
  22 | 
  23 |   test('登录后显示用户信息', async ({ page }) => {
  24 |     await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
  25 |     await page.goto('/profile');
  26 |     await page.waitForTimeout(1000);
  27 |     await expect(page.locator(`text=${TEST_ACCOUNTS[0].username}`)).toBeVisible();
  28 |   });
  29 | 
  30 |   test('退出登录', async ({ page }) => {
  31 |     await login(page, TEST_ACCOUNTS[0].email, TEST_ACCOUNTS[0].password);
  32 |     await page.goto('/profile');
  33 |     await page.waitForTimeout(2000);
  34 |     
  35 |     // 点击退出登录
  36 |     const logoutBtn = page.locator('button:has-text("退出")');
  37 |     if (await logoutBtn.isVisible()) {
  38 |       await logoutBtn.click();
  39 |       await page.waitForTimeout(1000);
  40 |       
  41 |       // 确认退出
  42 |       const confirmBtn = page.locator('button:has-text("确定")');
  43 |       if (await confirmBtn.isVisible()) {
  44 |         await confirmBtn.click();
  45 |         await page.waitForTimeout(2000);
  46 |       }
  47 |     }
  48 |   });
  49 | });
  50 | 
```