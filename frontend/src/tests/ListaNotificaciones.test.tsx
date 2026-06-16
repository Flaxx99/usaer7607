import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import ListaNotificaciones from '../pages/notificaciones/ListaNotificaciones';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ListaNotificaciones />
        </QueryClientProvider>
    );
};

const NOTIFICACIONES_DATA = {
    count: 2,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            titulo: 'Revisión de expedientes',
            contenido: 'Fecha límite: 30 de junio.',
            leido: false,
            fecha_creacion: '2026-06-10T10:00:00Z',
            tipo: 'aviso',
        },
        {
            id: 2,
            titulo: 'Recordatorio de reunión',
            contenido: 'Junta de consejo técnico el viernes.',
            leido: true,
            fecha_creacion: '2026-06-09T08:00:00Z',
            tipo: 'recordatorio',
        },
    ],
};

describe('ListaNotificaciones', () => {
    beforeEach(() => {
        server.use(
            http.get('*/notificaciones/', async () => {
                await delay(30);
                return HttpResponse.json(NOTIFICACIONES_DATA);
            }),
            http.patch('*/notificaciones/:id/', async ({ params }) => {
                await delay(30);
                return HttpResponse.json({ id: Number(params.id), leido: true });
            }),
            http.post('*/notificaciones/marcar-todas-leidas/', async () => {
                await delay(30);
                return HttpResponse.json({ mensaje: 'ok' });
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('muestra loading mientras carga', () => {
        renderPage();
        expect(screen.getByText('Cargando notificaciones...')).toBeInTheDocument();
    });

    it('renderiza lista de notificaciones después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Revisión de expedientes')).toBeInTheDocument();
        });

        expect(screen.getByText('Recordatorio de reunión')).toBeInTheDocument();
        expect(screen.getByText('Notificaciones')).toBeInTheDocument();
        // El botón "Marcar todas como leídas" aparece solo si hay notificaciones
        expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument();
    });

    it('muestra no leída con botón "Marcar leída"', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Revisión de expedientes')).toBeInTheDocument();
        });

        // No leída debe tener botón
        expect(screen.getByText('Marcar leída')).toBeInTheDocument();
    });

    it('muestra notificación leída sin botón', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Recordatorio de reunión')).toBeInTheDocument();
        });

        // La leída NO tiene botón "Marcar leída"
        expect(screen.queryAllByText('Marcar leída')).toHaveLength(1); // Solo la no leída
    });

    it('muestra empty state cuando no hay notificaciones', async () => {
        server.use(
            http.get('*/notificaciones/', async () => {
                await delay(30);
                return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No tienes notificaciones nuevas')).toBeInTheDocument();
        });
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/notificaciones/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Error al cargar')).toBeInTheDocument();
        });
    });
});
