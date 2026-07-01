import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import NotificacionBell from '../pages/notificaciones/NotificacionBell';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

const renderBell = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <NotificacionBell />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

const NO_LEIDAS_DATA = {
    count: 2,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            mensaje: 'Revisión de expedientes — Fecha límite: 30 de junio.',
            leida: false,
            fecha_creacion: '2026-06-30T10:00:00Z',
            url: null,
        },
        {
            id: 2,
            mensaje: 'Recordatorio de reunión — Junta de consejo técnico el viernes.',
            leida: false,
            fecha_creacion: '2026-06-29T08:00:00Z',
            url: null,
        },
    ],
};

describe('NotificacionBell', () => {
    beforeEach(() => {
        server.use(
            http.get('*/notificaciones/conteo/', async () => {
                await delay(20);
                return HttpResponse.json({ unread_count: 2 });
            }),
            http.get('*/notificaciones/no_leidas/', async () => {
                await delay(20);
                return HttpResponse.json(NO_LEIDAS_DATA);
            }),
            http.post('*/notificaciones/:id/marcar_leida/', async () => {
                await delay(20);
                return HttpResponse.json({ status: 'success', detail: 'marked as read' });
            }),
            http.post('*/notificaciones/marcar-todas-leidas/', async () => {
                await delay(20);
                return HttpResponse.json({ status: 'success', detail: 'all marked as read' });
            }),
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('renderiza el botón de campana sin badge cuando conteo es 0', async () => {
        server.use(
            http.get('*/notificaciones/conteo/', async () => {
                return HttpResponse.json({ unread_count: 0 });
            }),
        );

        renderBell();

        await waitFor(() => {
            expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
        });

        // Sin badge
        const badge = screen.queryByText('2');
        expect(badge).not.toBeInTheDocument();
    });

    it('muestra badge con count no leídas', async () => {
        renderBell();

        await waitFor(() => {
            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    it('abre dropdown y muestra notificaciones al hacer click', async () => {
        renderBell();

        const bell = await screen.findByLabelText('Notificaciones (2 sin leer)');
        fireEvent.click(bell);

        await waitFor(() => {
            expect(screen.getByText('Revisión de expedientes — Fecha límite: 30 de junio.')).toBeInTheDocument();
        });

        expect(screen.getByText('Recordatorio de reunión — Junta de consejo técnico el viernes.')).toBeInTheDocument();
    });

    it('muestra "Marcar todas" en dropdown cuando hay no leídas', async () => {
        renderBell();

        const bell = await screen.findByLabelText('Notificaciones (2 sin leer)');
        fireEvent.click(bell);

        await waitFor(() => {
            expect(screen.getByText('Marcar todas')).toBeInTheDocument();
        });
    });

    it('muestra "Ver todas" en dropdown', async () => {
        renderBell();

        const bell = await screen.findByLabelText('Notificaciones (2 sin leer)');
        fireEvent.click(bell);

        await waitFor(() => {
            expect(screen.getByText('Ver todas')).toBeInTheDocument();
        });
    });

    it('muestra "Todo al día" cuando no hay no leídas', async () => {
        server.use(
            http.get('*/notificaciones/conteo/', async () => {
                return HttpResponse.json({ unread_count: 0 });
            }),
            http.get('*/notificaciones/no_leidas/', async () => {
                return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
            }),
        );

        renderBell();

        // Abrimos dropdown
        const bell = await screen.findByLabelText('Notificaciones');
        fireEvent.click(bell);

        await waitFor(() => {
            expect(screen.getByText('Todo al día')).toBeInTheDocument();
        });
    });

    it('cierra dropdown al hacer click fuera', async () => {
        renderBell();

        const bell = await screen.findByLabelText('Notificaciones (2 sin leer)');
        fireEvent.click(bell);

        await waitFor(() => {
            expect(screen.getByText('Notificaciones')).toBeInTheDocument(); // header del dropdown
        });

        // Click fuera
        fireEvent.mouseDown(document.body);

        await waitFor(() => {
            expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
        });
    });
});
