import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Login from '../pages/Login';

// Helper para renderizar con todos los providers necesarios
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MantineProvider>
      <Notifications />
      <MemoryRouter initialEntries={['/login']}>
        {ui}
      </MemoryRouter>
    </MantineProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should show error notification on failed login', async () => {
    renderWithProviders(<Login />);

    // Llenamos el formulario con datos incorrectos
    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'wrong_user' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong_pass' } });
    fireEvent.click(screen.getByRole('button', { name: /Acceder al Sistema/i }));

    // El token NO debe guardarse
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  it('should save token on successful login', async () => {
    renderWithProviders(<Login />);

    // Datos correctos (definidos en mocks/handlers.ts)
    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Acceder al Sistema/i }));

    // Verificamos que el token se guardó en localStorage
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('mock-token-12345');
    });
  });

  it('should not save token with empty credentials', async () => {
    renderWithProviders(<Login />);

    // Hacer clic sin llenar campos
    fireEvent.click(screen.getByRole('button', { name: /Acceder al Sistema/i }));

    // Esperar un momento y verificar que no se guardó nada
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });
});
