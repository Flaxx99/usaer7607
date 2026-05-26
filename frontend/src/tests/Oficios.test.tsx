import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import OficiosList from '../pages/oficios/OficiosList';
import { uploadOficio, getOficios } from '../api/oficios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/oficios', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/oficios')>();
    return {
        ...actual,
        getOficios: vi.fn(),
        uploadOficio: vi.fn(),
    };
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {children}
            </MemoryRouter>
        </QueryClientProvider>
    </MantineProvider>
);

describe('Oficios File Upload Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should call uploadOficio with FormData when form is submitted', async () => {
        (getOficios as any).mockResolvedValue({
            count: 0,
            next: null,
            previous: null,
            results: []
        });
        (uploadOficio as any).mockResolvedValue({ id: 1, titulo: 'Test' });

        render(<OficiosList />, { wrapper });

        // Esperar a que el Skeleton desaparezca y aparezca el botón
        const openButton = await screen.findByText(/Subir Nuevo Oficio/i);
        fireEvent.click(openButton);

        // Llenar formulario
        fireEvent.change(await screen.findByLabelText(/Título del Oficio/i), { target: { value: 'Oficio Prueba' } });
        
        // Simular selección de archivo
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByLabelText(/Archivo \(PDF, Imagen\)/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Submit
        const submitButton = screen.getByText(/Subir Archivo/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(uploadOficio).toHaveBeenCalled();
            const callArgs = (uploadOficio as any).mock.calls[0][0];
            expect(callArgs).toBeInstanceOf(FormData);
            expect(callArgs.get('titulo')).toBe('Oficio Prueba');
            expect(callArgs.get('archivo')).toBeInstanceOf(File);
        });
    });
});
