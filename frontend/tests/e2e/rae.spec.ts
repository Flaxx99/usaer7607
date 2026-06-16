import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('RAE Value Flow', () => {
  test('should capture RAE data, maintain drafts on refresh, and save to backend', async ({ page }) => {
    await login(page, 'admin@test.com', 'pass123');
    
    // 1. Navigate to RAE Records and enter a capture session
    await page.goto('/rae');
    await expect(page.getByText('Registros RAE')).toBeVisible();
    
    // Click the first 'Edit' button (Edit2 icon)
    await page.locator('button').filter({ has: 'svg[data-lucide="edit-2"]' }).first().click();
    
    // Verify we are in the capture grid
    await expect(page.getByText('Captura RAE:')).toBeVisible();
    
    // 2. Modify data in the grid
    // Find first student row and toggle a checkbox (e.g., the first one in the row)
    const firstStudentRow = page.locator('tbody tr').first();
    const checkbox = firstStudentRow.locator('input[type="checkbox"]').first();
    
    // Ensure it's unchecked first for the test
    if (await checkbox.isChecked()) {
        await checkbox.uncheck();
    }
    await checkbox.check();
    
    // 3. Verify "Guardar Cambios" button updated its count
    await expect(page.getByRole('button', { name: /Guardar Cambios \(1\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Guardar Cambios \(1\)/i })).toBeEnabled();
    
    // 4. Simulate page refresh to test localStorage drafts
    await page.reload();
    
    // Verify we are still on the same page and the checkbox is still checked
    await expect(page.getByText('Captura RAE:')).toBeVisible();
    await expect(checkbox).toBeChecked();
    await expect(page.getByRole('button', { name: /Guardar Cambios \(1\)/i })).toBeVisible();
    
    // 5. Save changes to backend
    await page.getByRole('button', { name: /Guardar Cambios/i }).click();
    
    // Verify success toast
    await expect(page.getByText('¡Guardado!')).toBeVisible();
    
    // 6. Verify drafts are cleared after save
    await expect(page.getByRole('button', { name: /Guardar Cambios \(0\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Guardar Cambios \(0\)/i })).toBeDisabled();
  });
});
