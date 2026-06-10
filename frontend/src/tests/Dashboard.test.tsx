import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for faster tests
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({
      username: 'admin',
      first_name: 'Admin',
      role: 'ROLE_ADMIN',
      email: 'admin@usaer.edu.mx'
    }));
  });

  it('should show loading state initially', () => {
    renderWithProviders(<Dashboard />);
    // Dashboard shows DashboardSkeleton while loading — no stat labels yet
    expect(screen.queryByText('Alumnos Totales')).not.toBeInTheDocument();
  });

  it('should render dashboard data after successful API call', async () => {
    renderWithProviders(<Dashboard />);

    // Wait for loading to disappear and data to appear
    await waitFor(() => {
      expect(screen.getByText('Alumnos Totales')).toBeInTheDocument();
    });

    // Check greeting (accessible name concatenates text nodes)
    expect(screen.getByRole('heading', { name: /hola.*admin/i })).toBeInTheDocument();
    
    // Check stats cards
    expect(screen.getByText('Alumnos Totales')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Escuelas Regular')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Plantilla Docente')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Incidencias Pend.')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render the list of latest announcements', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Junta de Consejo Técnico')).toBeInTheDocument();
    });

    expect(screen.getByText('Actualización de Expedientes')).toBeInTheDocument();
    expect(screen.getByText(/2 publicaciones/i)).toBeInTheDocument();
  });

  it('should render the classification distribution section', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Verify the section heading renders (chart ticks need ResizeObserver + container size in JSDOM)
      expect(screen.getByText('Distribución de Matrícula')).toBeInTheDocument();
    });
  });

  it('should show error state when API call fails', async () => {
    // This test requires a specific MSW handler for failure
    // We can use server.use() to override the default handler for this test
    const { server } = await import('./mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.get('*/dashboard-data/', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error de Conexión/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/No pudimos contactar al backend/i)).toBeInTheDocument();
  });
});
