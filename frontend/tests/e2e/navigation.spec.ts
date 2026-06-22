import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Role-Based Navigation', () => {
  // Start fresh — navigation tests need to login as different roles
  test.use({ storageState: undefined });
  test('Admin should see all menu items including Users', async ({ page }) => {
    await login(page, 'admin@test.com', 'pass123');
    await expect(page.getByRole('link', { name: /usuarios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /escuelas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /alumnos/i })).toBeVisible();
  });

  test('Secretary should see Schools and Students but NOT Users', async ({ page }) => {
    await login(page, 'sec@test.com', 'pass123');
    await expect(page.getByRole('link', { name: /usuarios/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /escuelas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /alumnos/i })).toBeVisible();
  });

  test('Teacher should see only Students and Calendar', async ({ page }) => {
    await login(page, 'maestro@test.com', 'pass123');
    await expect(page.getByRole('link', { name: /usuarios/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /escuelas/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /alumnos/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /calendario/i })).toBeVisible();
  });
});
