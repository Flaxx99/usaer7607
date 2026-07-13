import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import Kiosco from '../pages/asistencia/Kiosco';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <Kiosco />
            </QueryClientProvider>
        </MemoryRouter>
    );
};

describe('Kiosco', () => {
    beforeEach(() => {
        localStorage.clear();
        // Solo falseamos Date, NO timers (para que MSW + delay() funcionen)
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-06-12T08:30:00'));
        server.use(
            http.post('*/asistencias/checar/', async ({ request }) => {
                const body = await request.json() as { numero_empleado?: string };
                if (body.numero_empleado === 'EMP001') {
                    return HttpResponse.json({
                        message: 'Entrada registrada correctamente',
                        tipo: 'ENTRADA' as const,
                        profesor: 'Juan Pérez',
                        hora: '08:30:05',
                    });
                }
                if (body.numero_empleado === 'OFFLINE') {
                    return HttpResponse.error();
                }
                return HttpResponse.json(
                    { detail: 'Empleado no encontrado.' },
                    { status: 404 }
                );
            })
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        server.resetHandlers();
        localStorage.clear();
    });

    it('renderiza reloj, fecha y formulario', () => {
        renderPage();

        expect(screen.getByText('08:30')).toBeInTheDocument();
        expect(screen.getByText(/viernes.*12.*junio.*2026/i)).toBeInTheDocument();
        expect(screen.getByText('Ingrese su N° de Empleado')).toBeInTheDocument();
        expect(screen.getByText('Acceso Admin')).toBeInTheDocument();
        // Botón desktop con aria-label (el mobile tiene texto visible, sin aria-label)
        expect(screen.getByLabelText('Checar asistencia')).toBeInTheDocument();
    });

    it('registra entrada exitosamente', async () => {
        renderPage();

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: 'EMP001' } });
        // Clicks en ambos botones son equivalentes (ambos submit del mismo form)
        fireEvent.click(screen.getAllByLabelText('Checar asistencia')[0]);

        // El input se resetea después del éxito
        await waitFor(() => {
            expect(screen.getByPlaceholderText('000000')).toHaveValue('');
        });
    });

    it('muestra error para empleado no encontrado', async () => {
        renderPage();

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: 'INVALIDO' } });
        fireEvent.click(screen.getAllByLabelText('Checar asistencia')[0]);

        // El input se resetea incluso en error
        await waitFor(() => {
            expect(screen.getByPlaceholderText('000000')).toHaveValue('');
        });
    });

    it('activa modo offline cuando no hay conexión', async () => {
        renderPage();

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: 'OFFLINE' } });
        fireEvent.click(screen.getAllByLabelText('Checar asistencia')[0]);

        await waitFor(() => {
            const pending = JSON.parse(localStorage.getItem('usaer_pending_attendance') || '[]');
            expect(pending.length).toBeGreaterThan(0);
            expect(pending[0].numero_empleado).toBe('OFFLINE');
        });
    });
});
