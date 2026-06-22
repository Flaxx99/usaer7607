import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Login Flow', () => {
  test.use({ storageState: undefined });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, 'admin@test.com', 'pass123');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('body')).toContainText('Administrador');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario o No. Empleado').fill('wrong@test.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('wrongpass');
    await page.getByRole('button', { name: /acceder al sistema/i }).click();

    const errorMsg = page.locator('text=Credenciales incorrectas');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });
});
