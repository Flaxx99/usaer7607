/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ListaAlumnos from '../pages/alumnos/ListaAlumnos';
import { getAlumnos } from '../api/alumnos';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/alumnos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/alumnos')>();
    return {
        ...actual,
        getAlumnos: vi.fn(),
    };
});

vi.mock('../api/escuelas', () => ({
    getEscuelas: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/usuarios', () => ({
    getMaestros: vi.fn().mockResolvedValue([]),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>
            {children}
        </MemoryRouter>
    </QueryClientProvider>
);

describe('Pagination & Filtering Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should fetch page 1 by default and page 2 when pagination is clicked', async () => {
        (getAlumnos as any).mockResolvedValue({
            count: 25,
            next: '...',
            previous: null,
            results: [{ id: 1, nombres: 'Alumno 1', apellido_paterno: 'Test', curp: '123', activo: true, escuela: 1, clasificacion: 'NINGUNO' }]
        });

        render(<ListaAlumnos />, { wrapper });

        // Verificar primera llamada
        await waitFor(() => {
            expect(getAlumnos).toHaveBeenCalledWith(1, '', 'TODAS', 'TODAS', 'ACTIVOS');
        });

        // Buscar botón "Siguiente" (navegación tipo join con iconos)
        const nextButton = await screen.findByRole('button', { name: /Página siguiente/i });
        fireEvent.click(nextButton);

        // Verificar que se llamó a la página 2
        await waitFor(() => {
            expect(getAlumnos).toHaveBeenCalledWith(2, '', 'TODAS', 'TODAS', 'ACTIVOS');
        });
    });

    it('should reset to page 1 when a search query is entered', async () => {
        (getAlumnos as any).mockResolvedValue({
            count: 25,
            next: null,
            previous: null,
            results: []
        });

        render(<ListaAlumnos />, { wrapper });

        // Ir a la página 2 primero
        const nextButton = await screen.findByRole('button', { name: /Página siguiente/i });
        fireEvent.click(nextButton);

        // Escribir en el buscador (esperar a que vuelva a renderizarse tras la carga)
        const searchInput = await screen.findByPlaceholderText(/Apellido, Nombre o CURP/i);
        fireEvent.change(searchInput, { target: { value: 'Juan' } });

        // Esperar al debounce (300ms) y verificar que la llamada es a la página 1
        await waitFor(() => {
            expect(getAlumnos).toHaveBeenCalledWith(1, 'Juan', 'TODAS', 'TODAS', 'ACTIVOS');
        }, { timeout: 1000 });
    });
});
