import { Page } from '@playwright/test';

export const TEST_ACCOUNTS = [
  { email: '2029390286@qq.com', password: 'zl123456', username: 'wtt11' },
  { email: 'test123@qq.com', password: 'zl123456', username: 'test123' },
  { email: '1679468108@qq.com', password: 'zl123456', username: 'zhaolong' },
];

export const API_BASE = 'http://localhost:3000';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  await page.waitForSelector('img[alt="验证码"]', { timeout: 5000 });
  
  let captchaId = '';
  page.on('response', async (response: any) => {
    if (response.url().includes('/api/auth/captcha')) {
      try {
        const data = await response.json();
        captchaId = data.data.captchaId;
      } catch {}
    }
  });
  
  await page.click('img[alt="验证码"]');
  await page.waitForTimeout(500);
  
  if (captchaId) {
    const [body] = captchaId.split('.');
    const payload = JSON.parse(atob(body));
    const code = payload.text;
    await page.fill('input[placeholder*="验证码"]', code);
  }
  
  await page.click('button[type="submit"]');
  
  // 等待页面加载（可能是首页或欢迎页）
  await page.waitForTimeout(3000);
  
  // 如果是欢迎页，创建一个默认账本
  const welcomeText = page.locator('text=欢迎来到静记');
  if (await welcomeText.isVisible({ timeout: 2000 }).catch(() => false)) {
    // 点击创建账本
    const createBtn = page.locator('button:has-text("创建")');
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // 填写账本名称
      const nameInput = page.locator('input[placeholder*="名称"]');
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('默认账本');
        await page.click('button:has-text("保存")');
        await page.waitForTimeout(2000);
      }
    }
  }
}
