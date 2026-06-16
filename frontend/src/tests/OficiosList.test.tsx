import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import OficiosList from '../pages/oficios/OficiosList';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <OficiosList />
        </QueryClientProvider>
    );
};

const OFICIOS_MOCK = {
    count: 2,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            titulo: 'Reporte Trimestral',
            descripcion: 'Evaluaciones del primer trimestre.',
            archivo: 'http://test.com/doc1.pdf',
            fecha_subida: '2026-06-01T10:00:00Z',
        },
        {
            id: 2,
            titulo: 'Oficio de Supervisión',
            descripcion: 'Circular para todos los directores.',
            archivo: 'http://test.com/doc2.pdf',
            fecha_subida: '2026-06-05T08:00:00Z',
        },
    ],
};

describe('OficiosList', () => {
    beforeEach(() => {
        server.use(
            http.get('*/api/oficios/', async () => {
                await delay(30);
                return HttpResponse.json(OFICIOS_MOCK);
            }),
            http.post('*/api/oficios/', async () => {
                await delay(30);
                return HttpResponse.json({ id: 99, titulo: 'Nuevo oficio' }, { status: 201 });
            }),
            http.delete('*/api/oficios/:id/', async () => {
                await delay(30);
                return new HttpResponse(null, { status: 204 });
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('muestra loading mientras carga', () => {
        renderPage();
        expect(screen.queryByText(/Error al cargar los oficios/i)).not.toBeInTheDocument();
    });

    it('renderiza lista de oficios después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Reporte Trimestral')).toBeInTheDocument();
        });

        expect(screen.getByText('Oficio de Supervisión')).toBeInTheDocument();
        expect(screen.getByText('Gestión de Oficios')).toBeInTheDocument();
        expect(screen.getByText('Subir Nuevo Oficio')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/api/oficios/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los oficios/i)).toBeInTheDocument();
        });
    });

    it('abre modal de subir oficio', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Gestión de Oficios')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Subir Nuevo Oficio'));

        await waitFor(() => {
            expect(screen.getByText('Subir Documento Oficial')).toBeInTheDocument();
        });

        expect(screen.getByText('Subir Archivo')).toBeInTheDocument();
    });

    it('cierra modal al cancelar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Gestión de Oficios')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Subir Nuevo Oficio'));

        await waitFor(() => {
            expect(screen.getByText('Subir Documento Oficial')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Subir Documento Oficial')).not.toBeInTheDocument();
        });
    });

    it('abre y confirma eliminación con confirm dialog', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Reporte Trimestral')).toBeInTheDocument();
        });

        // Clic en botón eliminar del primer oficio
        const deleteButtons = document.querySelectorAll('[title="Eliminar"]');
        expect(deleteButtons.length).toBeGreaterThan(0);
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Eliminar Oficio')).toBeInTheDocument();
        });

        // Confirmar
        fireEvent.click(screen.getByText('Eliminar'));

        await waitFor(() => {
            expect(screen.queryByText('Eliminar Oficio')).not.toBeInTheDocument();
        });
    });

    it('muestra empty state cuando no hay oficios', async () => {
        server.use(
            http.get('*/api/oficios/', async () => {
                await delay(30);
                return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/No hay oficios registrados/i)).toBeInTheDocument();
        });
    });
});
