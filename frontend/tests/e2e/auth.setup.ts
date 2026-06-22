import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = '.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel('Usuario o No. Empleado').fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('pass123');
  await page.getByRole('button', { name: /acceder al sistema/i }).click();
  await page.waitForURL(/.*dashboard/);

  // Verify login succeeded
  await expect(page.locator('body')).toContainText('Administrador');

  // Save authenticated state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
