import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page).toHaveTitle(/静记/);
});
