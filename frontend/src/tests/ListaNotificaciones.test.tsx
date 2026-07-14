import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
            mensaje: 'Revisión de expedientes — Fecha límite: 30 de junio.',
            leida: false,
            fecha_creacion: '2026-06-10T10:00:00Z',
            url: null,
        },
        {
            id: 2,
            mensaje: 'Recordatorio de reunión — Junta de consejo técnico el viernes.',
            leida: true,
            fecha_creacion: '2026-06-09T08:00:00Z',
            url: null,
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
            http.post('*/notificaciones/:id/marcar_leida/', async () => {
                await delay(30);
                return HttpResponse.json({ detail: 'marked as read' });
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
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('renderiza lista de notificaciones después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Revisión de expedientes — Fecha límite: 30 de junio.')).toBeInTheDocument();
        });

        expect(screen.getByText('Recordatorio de reunión — Junta de consejo técnico el viernes.')).toBeInTheDocument();
        expect(screen.getByText('Notificaciones')).toBeInTheDocument();
        // El botón "Marcar todas como leídas" aparece solo si hay notificaciones
        expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument();
    });

    it('muestra no leída con botón "Marcar leída"', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Revisión de expedientes — Fecha límite: 30 de junio.')).toBeInTheDocument();
        });

        // No leída debe tener botón
        expect(screen.getByText('Marcar leída')).toBeInTheDocument();
    });

    it('muestra notificación leída sin botón', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Recordatorio de reunión — Junta de consejo técnico el viernes.')).toBeInTheDocument();
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
