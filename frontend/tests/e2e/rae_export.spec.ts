import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('RAE Export Flow', () => {
  test('should export official RAE Excel file from validation panel', async ({ page }) => {
    await login(page, 'admin@test.com', 'pass123');

    // 1. Navigate to RAE Records list
    await page.goto('/rae');
    await expect(page.getByText('Registros RAE')).toBeVisible();

    // 2. Click the first "Validar y Exportar" button (CheckCircle icon)
    await page.locator('button[title="Validar y Exportar"]').first().click();

    // 3. Wait for validation panel to load
    await expect(page.getByText('Validación de Totales RAE')).toBeVisible();

    // 4. Verify categories are displayed (data from seed)
    await expect(page.getByText('DISCAPACIDAD')).toBeVisible();
    await expect(page.getByText('DIFICULTADES')).toBeVisible();
    await expect(page.getByText('APOYOS')).toBeVisible();
    await expect(page.getByText('PORTAFOLIO')).toBeVisible();

    // 5. Click "Descargar Archivo Oficial" and verify download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.getByRole('button', { name: /descargar archivo oficial/i }).click(),
    ]);

    // 6. Verify downloaded file
    expect(download.suggestedFilename()).toMatch(/^RAE_Oficial_/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const totalBytes = chunks.reduce((sum, c) => sum + c.length, 0);
    expect(totalBytes).toBeGreaterThan(0);
  });
});
