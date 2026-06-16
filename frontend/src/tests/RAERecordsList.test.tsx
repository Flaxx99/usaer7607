import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import { LoadingProvider } from '../context/LoadingContext';
import RAERecordsList from '../pages/rae/RAERecordsList';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <LoadingProvider>
                    <RAERecordsList />
                </LoadingProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
};

const RAE_MOCK = {
    count: 2,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            escuela_nombre: 'Escuela Primaria Test',
            ciclo_nombre: '2025-2026',
            fecha_creacion: '2026-06-01T10:00:00Z',
            docente_hombres: 3,
            docente_mujeres: 5,
        },
        {
            id: 2,
            escuela_nombre: 'Escuela Secundaria Demo',
            ciclo_nombre: '2025-2026',
            fecha_creacion: '2026-06-05T08:00:00Z',
            docente_hombres: 2,
            docente_mujeres: 4,
        },
    ],
};

describe('RAERecordsList', () => {
    beforeEach(() => {
        server.use(
            http.get('*/api/rae/mis_registros/', async () => {
                await delay(30);
                return HttpResponse.json(RAE_MOCK);
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('renderiza lista RAE después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getAllByText('Escuela Primaria Test').length).toBeGreaterThanOrEqual(1);
        });

        expect(screen.getAllByText('Escuela Secundaria Demo').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Registros RAE')).toBeInTheDocument();
        expect(screen.getByText('Generar RAE')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/api/rae/mis_registros/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los registros RAE/i)).toBeInTheDocument();
        });
    });
});
