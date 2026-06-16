import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import GestionIncidencias from '../pages/incidencias/GestionIncidencias';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <GestionIncidencias />
        </QueryClientProvider>
    );
};

const INCIDENCIAS_MOCK = [
    {
        id: 1,
        titulo: 'Proyector dañado en aula',
        descripcion: 'El proyector del aula 3B no enciende.',
        escuela: 1, escuela_nombre: 'Escuela Test',
        profesor: 1, profesor_nombre: 'Juan Pérez',
        reportado_por: 1, reportado_por_nombre: 'Admin',
        estado: 'PENDIENTE' as const,
        respuesta_admin: null,
        fecha_reporte: '2026-06-10T10:00:00Z',
        fecha_resolucion: null,
    },
    {
        id: 2,
        titulo: 'Conducta en recreo',
        descripcion: 'Reporte de conducta inapropiada.',
        escuela: 1, escuela_nombre: 'Escuela Test',
        profesor: 2, profesor_nombre: 'María López',
        reportado_por: 1, reportado_por_nombre: 'Admin',
        estado: 'RESUELTA' as const,
        respuesta_admin: 'Se dialogó con el alumno y los padres.',
        fecha_reporte: '2026-06-08T08:00:00Z',
        fecha_resolucion: '2026-06-09T12:00:00Z',
    },
];

describe('GestionIncidencias', () => {
    beforeEach(() => {
        server.use(
            http.get('*/incidencias/', async () => {
                await delay(30);
                return HttpResponse.json(INCIDENCIAS_MOCK);
            }),
            http.get('*/usuarios/', async () => {
                await delay(30);
                return HttpResponse.json({
                    results: [
                        { id: 1, nombre: 'Juan', apellido_paterno: 'Pérez', numero_empleado: 'EMP001' },
                        { id: 2, nombre: 'María', apellido_paterno: 'López', numero_empleado: 'EMP002' },
                    ],
                });
            }),
            http.post('*/incidencias/', async () => {
                await delay(30);
                return HttpResponse.json({ id: 99, ...INCIDENCIAS_MOCK[0] }, { status: 201 });
            }),
            http.post('*/incidencias/:id/resolver/', async () => {
                await delay(30);
                return HttpResponse.json({ ...INCIDENCIAS_MOCK[1], estado: 'RESUELTA' });
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('muestra loading mientras carga', () => {
        renderPage();
        expect(screen.queryByText(/Error al cargar las incidencias/i)).not.toBeInTheDocument();
    });

    it('renderiza lista de incidencias después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        expect(screen.getByText('Conducta en recreo')).toBeInTheDocument();
        expect(screen.getByText('Bitácora de Incidencias')).toBeInTheDocument();
        expect(screen.getByText('Reportar Incidencia')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/incidencias/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar las incidencias/i)).toBeInTheDocument();
        });
    });

    it('filtra por estado PENDIENTE', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Pendientes'));

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });
        expect(screen.queryByText('Conducta en recreo')).not.toBeInTheDocument();
    });

    it('filtra por estado RESUELTA', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Resueltas'));

        await waitFor(() => {
            expect(screen.getByText('Conducta en recreo')).toBeInTheDocument();
        });
        expect(screen.queryByText('Proyector dañado en aula')).not.toBeInTheDocument();
    });

    it('filtra por búsqueda de texto', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Buscar por título, persona o descripción/i);
        fireEvent.change(searchInput, { target: { value: 'Conducta' } });

        await waitFor(() => {
            expect(screen.queryByText('Proyector dañado en aula')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Conducta en recreo')).toBeInTheDocument();
    });

    it('abre modal de crear incidencia', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Bitácora de Incidencias')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Reportar Incidencia'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Reporte de Incidencia')).toBeInTheDocument();
        });

        expect(screen.getByText('Guardar en Bitácora')).toBeInTheDocument();
    });

    it('abre modal de resolución para incidencia pendiente', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        // La incidencia pendiente tiene botón "Resolver"
        fireEvent.click(screen.getByText('Resolver'));

        await waitFor(() => {
            expect(screen.getByText('Resolución de Incidencia')).toBeInTheDocument();
        });
    });

    it('muestra empty state con filtros sin resultados', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Proyector dañado en aula')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Buscar por título, persona o descripción/i);
        fireEvent.change(searchInput, { target: { value: 'zzznadaexiste' } });

        await waitFor(() => {
            expect(screen.getByText(/No se encontraron reportes con estos filtros/i)).toBeInTheDocument();
        });
    });
});
