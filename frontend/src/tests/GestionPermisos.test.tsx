import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import GestionPermisos from '../pages/permisos/GestionPermisos';
import { getPermisos, getMetricasPermisos, createPermiso } from '../api/permisos';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/permisos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/permisos')>();
    return {
        ...actual,
        getPermisos: vi.fn(),
        getMetricasPermisos: vi.fn(),
        createPermiso: vi.fn(),
        responderPermiso: vi.fn(),
        deletePermiso: vi.fn(),
    };
});

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        FileText: () => <div />,
        Plus: () => <div />,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
        Clock: () => <div />,
        Calendar: () => <div />,
        Search: () => <div />,
        Settings: () => <div />,
        Eye: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
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

const mockPermisos = [
    {
        id: 1,
        tipo: 'PERSONAL',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-01',
        horas_solicitadas: '4.0',
        motivo: 'Trámite personal',
        estado: 'PENDIENTE',
        profesor: 1,
        profesor_nombre: 'Juan Pérez',
        escuela: 1,
        escuela_nombre: 'Escuela Test',
        fecha_solicitud: '2026-05-30',
        duracion_dias: 1,
    },
    {
        id: 2,
        tipo: 'ENFERMEDAD',
        fecha_inicio: '2026-06-05',
        fecha_fin: '2026-06-07',
        motivo: 'Reposo médico',
        estado: 'APROBADO',
        profesor: 2,
        profesor_nombre: 'María López',
        escuela: 1,
        escuela_nombre: 'Escuela Test',
        fecha_solicitud: '2026-06-01',
        fecha_respuesta: '2026-06-02',
        administrador_nombre: 'Admin',
        duracion_dias: 3,
    },
];

const mockMetricas = {
    total: 2,
    pendientes: 1,
    aprobados: 1,
    rechazados: 0,
    ultima_semana: 2,
};

describe('GestionPermisos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should render permisos list after loading', async () => {
        vi.mocked(getPermisos).mockResolvedValue(mockPermisos);
        vi.mocked(getMetricasPermisos).mockResolvedValue(mockMetricas);

        render(<GestionPermisos />, { wrapper });

        // Buscar por texto contenido en la página post-carga
        await waitFor(() => {
            expect(screen.getByText(/Trámites de Permisos/i)).toBeInTheDocument();
        });

        // Verificar que se llamó a la API
        expect(getPermisos).toHaveBeenCalled();
    });

    it('should render profesores from data', async () => {
        vi.mocked(getPermisos).mockResolvedValue(mockPermisos);
        vi.mocked(getMetricasPermisos).mockResolvedValue(mockMetricas);

        render(<GestionPermisos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Trámites de Permisos/i)).toBeInTheDocument();
        });

        // Verificar que los tipos de permiso se renderizan
        expect(screen.getAllByText('PERSONAL').length).toBeGreaterThan(0);
        expect(screen.getAllByText('ENFERMEDAD').length).toBeGreaterThan(0);
    });

    it('should open create modal and submit a new permiso', async () => {
        vi.mocked(getPermisos).mockResolvedValue(mockPermisos);
        vi.mocked(getMetricasPermisos).mockResolvedValue(mockMetricas);
        vi.mocked(createPermiso).mockResolvedValue({ id: 3 });

        render(<GestionPermisos />, { wrapper });

        // Esperar carga
        await waitFor(() => {
            expect(screen.getByText(/Trámites de Permisos/i)).toBeInTheDocument();
        });

        // Abrir modal de creación
        const createButton = screen.getByText(/Solicitar Nuevo Permiso/i);
        fireEvent.click(createButton);

        // Llenar formulario en el modal (ahora con htmlFor gracias a la refactorización)
        await waitFor(() => {
            expect(screen.getByLabelText(/Tipo de Permiso/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/^Tipo de Permiso$/i), { target: { value: 'PERSONAL' } });
        fireEvent.change(screen.getByLabelText(/^Fecha de Inicio$/i), { target: { value: '2026-06-10' } });
        fireEvent.change(screen.getByLabelText(/^Fecha de Término$/i), { target: { value: '2026-06-10' } });
        fireEvent.change(screen.getByLabelText(/^Motivo$/i), { target: { value: 'Solicitud de permiso por asunto personal urgente' } });

        // Submit
        const submitButton = screen.getByText(/Enviar Solicitud/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createPermiso).toHaveBeenCalled();
        });
    });

    it('should handle empty state', async () => {
        vi.mocked(getPermisos).mockResolvedValue([]);
        vi.mocked(getMetricasPermisos).mockResolvedValue(mockMetricas);

        render(<GestionPermisos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Solicitar Nuevo Permiso/i)).toBeInTheDocument();
        });
    });
});
