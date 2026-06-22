import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  // Clear any previous session so we start fresh
  await page.context().clearCookies();
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel('Usuario o No. Empleado').fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  
  // Attempt login with retry for rate limiting (429)
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.getByRole('button', { name: /acceder al sistema/i }).click();
    
    // Wait briefly; if redirected to dashboard, success
    const dashboard = page.waitForURL(/.*dashboard/, { timeout: 5000 }).then(() => true).catch(() => false);
    if (await dashboard) return;
    
    // If still on login page, check for retry
    if (attempt < maxRetries) {
      await page.waitForTimeout(3000);  // Wait for rate limit window
    }
  }
  
  // Final attempt — let it throw naturally
  await page.waitForURL(/.*dashboard/);
}
