import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import { LoadingProvider } from '../context/LoadingContext';
import RACList from '../pages/rac/RACList';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    return render(
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <LoadingProvider>
                    <RACList />
                </LoadingProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
};

const RAC_MOCK = {
    count: 1,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            alumno_nombre: 'Juan Pérez López',
            curp: 'PELJ090101HDFLSN07',
            clasificacion: 'DISCAPACIDAD_MOTRIZ',
            subclasificacion: 'Parálisis Cerebral',
            maestro_nombre: 'Lic. María García',
        },
    ],
};

describe('RACList', () => {
    beforeEach(() => {
        localStorage.clear();
        server.use(
            http.get('*/api/rac/', async () => {
                await delay(30);
                return HttpResponse.json(RAC_MOCK);
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
        localStorage.clear();
    });

    it('renderiza lista RAC después de cargar', async () => {
        renderPage();

        // DataTable renderiza cada fila en mobile card + desktop table
        await waitFor(() => {
            expect(screen.getAllByText('Juan Pérez López').length).toBeGreaterThanOrEqual(1);
        });

        expect(screen.getByText('Registros RAC')).toBeInTheDocument();
        expect(screen.getByText('Nuevo Registro')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/api/rac/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los registros RAC/i)).toBeInTheDocument();
        });
    });

    it('muestra botón Exportar Todo para admin', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getAllByText('Juan Pérez López').length).toBeGreaterThanOrEqual(1);
        });

        expect(screen.getByText('Exportar Todo')).toBeInTheDocument();
        expect(screen.getByText('Generar RAC')).toBeInTheDocument();
    });

    it('navega a nuevo registro al hacer clic', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Registros RAC')).toBeInTheDocument();
        });

        const nuevoBtn = screen.getByText('Nuevo Registro');
        expect(nuevoBtn).toBeInTheDocument();
    });
});
