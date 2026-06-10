import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

// Helper para renderizar con todos los providers necesarios
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
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
    fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), { target: { value: 'wrong_pass' } });
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
    fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), { target: { value: 'admin123' } });
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
