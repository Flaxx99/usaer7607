import { test, expect } from '@playwright/test';

test.describe('Students Value Flow', () => {
  test('should create a new student successfully', async ({ page }) => {
    // Pre-authenticated via global setup (storageState: .auth/admin.json)
    await page.goto('/alumnos');
    await page.getByRole('button', { name: /nuevo ingreso alumno/i }).click();
    
    const modal = page.locator('.modal-box'); 
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueCurp = `TEST${randomId}1234567890`;
    
    await modal.getByPlaceholder('Ej. LUIS ANGEL').fill(`Test Alumno ${randomId}`);
    await modal.getByPlaceholder('Ej. VIDAL').fill('Test Paterno');
    await modal.getByPlaceholder('Ej. BUSTAMANTE').fill('Test Materno');
    await modal.getByPlaceholder('18 CARACTERES').fill(uniqueCurp); 
    await modal.locator('input[type="date"]').fill('2018-01-01');
    // Sexo: first option (H = Niño)
    await modal.locator('select').nth(0).selectOption({ index: 0 });
    // Profesor: skip (leave default)
    // Escuela: select the seeded school
    await modal.locator('select').nth(2).selectOption({ index: 1 });
    // Grado: leave default (1°)
    await modal.getByPlaceholder('Ej. A').fill('A');
    
    await modal.getByRole('button', { name: /guardar ficha/i }).click();
    
    await expect(page.locator('tr').filter({ hasText: `Test Alumno ${randomId}` })).toBeVisible({ timeout: 10000 });
    await expect(modal).not.toBeVisible();
  });

  test('should promote students to the next grade', async ({ page }) => {
    // Pre-authenticated via global setup (storageState: .auth/admin.json)
    
    // 1. Create a student in grade 1
    await page.goto('/alumnos');
    await page.getByRole('button', { name: /nuevo ingreso alumno/i }).click();
    const modal = page.locator('.modal-box'); 
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueCurp = `PROM${randomId}1234567890`;
    await modal.getByPlaceholder('Ej. LUIS ANGEL').fill(`Promovible ${randomId}`);
    await modal.getByPlaceholder('Ej. VIDAL').fill('Test Paterno');
    await modal.getByPlaceholder('Ej. BUSTAMANTE').fill('Test Materno');
    await modal.getByPlaceholder('18 CARACTERES').fill(uniqueCurp); 
    await modal.locator('input[type="date"]').fill('2018-01-01');
    await modal.locator('select').first().selectOption({ index: 0 });
    await modal.locator('select').nth(2).selectOption({ index: 1 });
    await modal.getByPlaceholder('Ej. A').fill('A');
    await modal.getByRole('button', { name: /guardar ficha/i }).click();
    await expect(page.getByRole('table').getByText(`Promovible ${randomId}`)).toBeVisible();

    // 2. Go to Cycles and execute promotion
    await page.goto('/ciclos');
    await page.getByRole('button', { name: /promoción de grado/i }).click();
    
    // Wait for preview to load
    await expect(page.locator('text=Promovidos')).toBeVisible();
    await page.getByRole('button', { name: /ejecutar cierre/i }).click();
    
    // Wait for promotion to complete (the modal should close and success toast appear)
    // The toast contains "¡Promoción Exitosa!"
    await expect(page.getByText('¡Promoción Exitosa!')).toBeVisible({ timeout: 30000 });
    
    // 3. Verify student is now in grade 2
    await page.goto('/alumnos');
    await expect(page.getByRole('table').getByText(`Promovible ${randomId}`)).toBeVisible();
    // Search for the student and check their grade in the table
    // Since DataTable shows grade, we just check if '2' appears near the student name
    const studentRow = page.locator('tr').filter({ hasText: `Promovible ${randomId}` });
    await expect(studentRow).toContainText('2');
  });

});
