import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import HistorialAsistencia from '../pages/asistencia/HistorialAsistencia';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <HistorialAsistencia />
        </QueryClientProvider>
    );
};

const ASISTENCIA_MOCK = [
    {
        id: 1,
        profesor: 1,
        profesor_nombre: 'Juan Pérez',
        escuela: 1,
        escuela_nombre: 'Escuela Primaria Test',
        fecha: '2026-06-10',
        presente: true,
        hora_entrada: '08:00:00',
        hora_salida: '14:30:00',
    },
    {
        id: 2,
        profesor: 2,
        profesor_nombre: 'María López',
        escuela: 1,
        escuela_nombre: 'Escuela Primaria Test',
        fecha: '2026-06-10',
        presente: true,
        hora_entrada: '08:15:00',
        hora_salida: null,
    },
];

describe('HistorialAsistencia', () => {
    beforeEach(() => {
        server.use(
                http.get('*/asistencias/', async () => {
                await delay(30);
                return HttpResponse.json(ASISTENCIA_MOCK);
            })
        );
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it('muestra loading mientras carga', () => {
        renderPage();
        expect(screen.getByText('Historial de Asistencia')).toBeInTheDocument();
    });

    it('renderiza tabla de asistencia después de cargar', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        });

        expect(screen.getByText('María López')).toBeInTheDocument();
        expect(screen.getByText('08:00:00')).toBeInTheDocument();
        expect(screen.getByText('14:30:00')).toBeInTheDocument();
        expect(screen.getByText('COMPLETO')).toBeInTheDocument();
        expect(screen.getByText('EN CURSO')).toBeInTheDocument();
    });

    it('muestra error state cuando falla la API', async () => {
        server.use(
            http.get('*/asistencias/', async () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar el historial de asistencia/i)).toBeInTheDocument();
        });
    });

    it('muestra empty state cuando no hay registros', async () => {
        server.use(
            http.get('*/asistencias/', async () => {
                await delay(30);
                return HttpResponse.json([]);
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/No hay registros de asistencia/i)).toBeInTheDocument();
        });
    });

    it('tiene filtro de fecha', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Historial de Asistencia')).toBeInTheDocument();
        });

        const dateInput = document.querySelector('input[type="date"]');
        expect(dateInput).toBeInTheDocument();
    });

    it('muestra stats cards cuando hay registros', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Registros')).toBeInTheDocument();
        });

        expect(screen.getByText('Completos')).toBeInTheDocument();
        expect(screen.getByText('En curso')).toBeInTheDocument();
        expect(screen.getByText('Promedio')).toBeInTheDocument();
        // El total de registros del mock es 2
        expect(screen.getByText('6.5h')).toBeInTheDocument();
    });

    it('no muestra stats cuando no hay registros', async () => {
        server.use(
            http.get('*/asistencias/', async () => {
                await delay(30);
                return HttpResponse.json([]);
            })
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/No hay registros/i)).toBeInTheDocument();
        });

        expect(screen.queryByText('Registros')).not.toBeInTheDocument();
    });
});
