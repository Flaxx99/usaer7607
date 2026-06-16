import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';
import RACForm from '../pages/rac/RACForm';

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
                    <RACForm />
                </LoadingProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
};

describe('RACForm', () => {
    it('renderiza el formulario después de cargar datos', async () => {
        renderPage();

        expect(await screen.findByText('Nuevo Registro RAC')).toBeInTheDocument();
        expect(screen.getByText('Busca por nombre o CURP...')).toBeInTheDocument();
        expect(screen.getByText('Clasificación')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('seleccionar alumno muestra detalles', async () => {
        const user = userEvent.setup();
        renderPage();

        const select = await screen.findByRole('combobox', { name: /seleccionar alumno/i });
        await user.selectOptions(select, '1');

        await waitFor(() => {
            expect(screen.getByText('Pérez López, Juan')).toBeInTheDocument();
            expect(screen.getByText('PELJ010101HDFRRT01')).toBeInTheDocument();
        });
    });

    it('seleccionar clasificación habilita subclasificación', async () => {
        const user = userEvent.setup();
        renderPage();

        const alumnoSelect = await screen.findByRole('combobox', { name: /seleccionar alumno/i });
        await user.selectOptions(alumnoSelect, '1');

        await waitFor(() => {
            expect(screen.getByText('Pérez López, Juan')).toBeInTheDocument();
        });

        const clasifSelect = screen.getByRole('combobox', { name: /^Clasificación$/ });
        await user.selectOptions(clasifSelect, 'DISCAPACIDAD');

        // Al seleccionar clasificación, subclasificación se habilita y muestra opciones reales
        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /^Subclasificación$/ })).not.toBeDisabled();
            expect(screen.getByText('Selecciona la sub-categoría')).toBeInTheDocument();
        });
    });

    it('muestra error si se intenta guardar sin clasificación', async () => {
        const user = userEvent.setup();
        renderPage();

        const alumnoSelect = await screen.findByRole('combobox', { name: /seleccionar alumno/i });
        await user.selectOptions(alumnoSelect, '1');

        await waitFor(() => {
            expect(screen.getByText('Pérez López, Juan')).toBeInTheDocument();
        });

        const guardarBtn = screen.getByRole('button', { name: /guardar/i });
        await user.click(guardarBtn);

        await waitFor(() => {
            expect(screen.getByText('La clasificación es obligatoria')).toBeInTheDocument();
        });
    });
});
