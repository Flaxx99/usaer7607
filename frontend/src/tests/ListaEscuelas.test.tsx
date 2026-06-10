/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ListaEscuelas from '../pages/escuelas/ListaEscuelas';
import { getEscuelas, createEscuela } from '../api/escuelas';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/escuelas', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/escuelas')>();
    return {
        ...actual,
        getEscuelas: vi.fn(),
        createEscuela: vi.fn(),
        updateEscuela: vi.fn(),
        deleteEscuela: vi.fn(),
    };
});

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Plus: () => <div />,
        Search: () => <div />,
        School: () => <div />,
        Edit2: () => <div />,
        Trash2: () => <div />,
        MapPin: () => <div />,
        Save: () => <div />,
        AlertTriangle: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
);

const mockEscuelas = [
    {
        id: 1,
        nombre: 'Escuela Primaria Test',
        cct: '08DPR0001A',
        clave_estatal: '08TEST001',
        nivel: 'PRIMARIA',
        zona: '001',
        domicilio: 'Calle Principal 123',
        colonia: 'Centro',
        localidad: 'Chihuahua',
        activo: true,
    },
    {
        id: 2,
        nombre: 'Jardín de Niños Test',
        cct: '08DJN0002B',
        clave_estatal: '08TEST002',
        nivel: 'PREESCOLAR',
        zona: '002',
        domicilio: 'Av. Secundaria 456',
        colonia: 'Norte',
        localidad: 'Chihuahua',
        activo: true,
    },
];

describe('ListaEscuelas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should render escuelas list after loading', async () => {
        (getEscuelas as any).mockResolvedValue(mockEscuelas);

        render(<ListaEscuelas />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('08DPR0001A')).toBeInTheDocument();
        });

        expect(screen.getByText('08DJN0002B')).toBeInTheDocument();
    });

    it('should open create modal', async () => {
        (getEscuelas as any).mockResolvedValue([]);

        render(<ListaEscuelas />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Registrar Nueva Escuela/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Registrar Nueva Escuela/i));

        await waitFor(() => {
            expect(screen.getByLabelText(/Nombre de la Escuela/i)).toBeInTheDocument();
        });
    });

    it('should create a new escuela', async () => {
        (getEscuelas as any).mockResolvedValue([]);
        (createEscuela as any).mockResolvedValue({ id: 3 });

        render(<ListaEscuelas />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Registrar Nueva Escuela/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Registrar Nueva Escuela/i));

        await waitFor(() => {
            expect(screen.getByLabelText(/Nombre de la Escuela/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/^Nombre de la Escuela$/i), { target: { value: 'Escuela Nueva' } });
        fireEvent.change(screen.getByLabelText(/^CCT$/i), { target: { value: '08DPR0003C' } });
        fireEvent.change(screen.getByLabelText(/^Clave Estatal$/i), { target: { value: '08TEST003' } });
        fireEvent.change(screen.getByLabelText(/^Nivel Educativo$/i), { target: { value: 'Primaria' } });
        fireEvent.change(screen.getByLabelText(/^Zona Escolar$/i), { target: { value: '003' } });
        fireEvent.change(screen.getByLabelText(/^Domicilio Completo$/i), { target: { value: 'Calle Nueva 789' } });
        fireEvent.change(screen.getByLabelText(/^Colonia$/i), { target: { value: 'Centro' } });

        const submitButton = screen.getByText(/Registrar Escuela/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createEscuela).toHaveBeenCalled();
        });
    });

    it('should handle empty state', async () => {
        (getEscuelas as any).mockResolvedValue([]);

        render(<ListaEscuelas />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Registrar Nueva Escuela/i)).toBeInTheDocument();
        });
    });
});
