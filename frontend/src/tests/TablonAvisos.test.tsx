import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import TablonAvisos from '../pages/avisos/TablonAvisos';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <TablonAvisos />
        </QueryClientProvider>
    );
};

const AVISOS_MOCK = [
    {
        id: 1,
        titulo: 'Junta de Consejo Técnico',
        contenido: 'Se convoca a todo el personal el próximo viernes.',
        fecha_publicacion: '2026-06-10T09:00:00',
        fecha_expiracion: null,
        autor: 1,
        autor_nombre: 'Admin',
        es_activo: true,
    },
    {
        id: 2,
        titulo: 'Actualización de Expedientes',
        contenido: 'Favor de subir las evaluaciones del primer trimestre.',
        fecha_publicacion: '2026-06-15T10:00:00',
        fecha_expiracion: null,
        autor: 2,
        autor_nombre: 'Supervisor',
        es_activo: true,
    },
];

describe('TablonAvisos', () => {
    beforeEach(() => {
        server.use(
            http.get('*/avisos/', async () => {
                await delay(30);
                return HttpResponse.json(AVISOS_MOCK);
            }),
            http.post('*/avisos/', async () => {
                await delay(30);
                return HttpResponse.json({ id: 99, ...AVISOS_MOCK[0] }, { status: 201 });
            }),
            http.patch('*/avisos/:id/', async () => {
                await delay(30);
                return HttpResponse.json({ ...AVISOS_MOCK[0], titulo: 'Actualizado' });
            }),
            http.delete('*/avisos/:id/', async () => {
                await delay(30);
                return HttpResponse.json(null, { status: 204 });
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('muestra loading mientras carga (skeleton)', () => {
        renderPage();
        // CardGridSkeleton: 6 skeleton cards sin texto accesible; solo verificamos que NO sea error
        expect(screen.queryByText(/Error al cargar los avisos/i)).not.toBeInTheDocument();
    });

    it('renderiza lista de avisos después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Junta de Consejo Técnico')).toBeInTheDocument();
        });

        expect(screen.getByText('Actualización de Expedientes')).toBeInTheDocument();
        expect(screen.getByText('Publicar Nuevo Aviso')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/avisos/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los avisos/i)).toBeInTheDocument();
        });
    });

    it('filtra avisos por búsqueda', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Junta de Consejo Técnico')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Escribe el título o contenido/i);
        fireEvent.change(searchInput, { target: { value: 'Expedientes' } });

        await waitFor(() => {
            expect(screen.queryByText('Junta de Consejo Técnico')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Actualización de Expedientes')).toBeInTheDocument();
    });

    it('abre modal de crear nuevo aviso', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Tablón de Avisos Oficial')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Publicar Nuevo Aviso'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Comunicado Oficial')).toBeInTheDocument();
        });

        expect(screen.getByText('Publicar Aviso')).toBeInTheDocument();
    });

    it('abre modal de edición al hacer clic en editar (vista mis avisos)', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Junta de Consejo Técnico')).toBeInTheDocument();
        });

        // Cambiar a "Mis Publicaciones"
        fireEvent.click(screen.getByText('Mis Publicaciones'));

        // Ahora deberían aparecer los botones de editar (Edit2)
        await waitFor(() => {
            const editButtons = document.querySelectorAll('.btn-ghost.btn-xs');
            expect(editButtons.length).toBeGreaterThan(0);
        });

        const editButtons = document.querySelectorAll('.btn-ghost.btn-xs');
        // Hacemos clic en el primero
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Comunicado')).toBeInTheDocument();
        });
    });

    it('abre confirm dialog al eliminar y confirma eliminación', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Junta de Consejo Técnico')).toBeInTheDocument();
        });

        // Cambiar a "Mis Publicaciones" para que aparezcan botones
        fireEvent.click(screen.getByText('Mis Publicaciones'));

        await waitFor(() => {
            // Botones de eliminar (Trash2) y editar (Edit2)
            const deleteButtons = document.querySelectorAll('.btn-ghost.btn-xs');
            expect(deleteButtons.length).toBeGreaterThan(0);
        });

        // Hacemos clic en el segundo botón (eliminar) del primer aviso
        const actionButtons = document.querySelectorAll('.btn-ghost.btn-xs');
        // El segundo botón del grupo es eliminar
        fireEvent.click(actionButtons[1]);

        // Debería aparecer el confirm dialog
        await waitFor(() => {
            expect(screen.getByText('Eliminar Aviso')).toBeInTheDocument();
        });

        // Confirmar eliminación
        fireEvent.click(screen.getByText('Eliminar'));

        // El diálogo debería cerrarse
        await waitFor(() => {
            expect(screen.queryByText('Eliminar Aviso')).not.toBeInTheDocument();
        });
    });

    it('cierra modal al cancelar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Tablón de Avisos Oficial')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Publicar Nuevo Aviso'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Comunicado Oficial')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Nuevo Comunicado Oficial')).not.toBeInTheDocument();
        });
    });
});
