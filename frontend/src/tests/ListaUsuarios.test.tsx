/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ListaUsuarios from '../pages/usuarios/ListaUsuarios';
import { getUsuarios, createUsuario } from '../api/usuarios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/usuarios', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/usuarios')>();
    return {
        ...actual,
        getUsuarios: vi.fn(),
        createUsuario: vi.fn(),
        updateUsuario: vi.fn(),
        deleteUsuario: vi.fn(),
    };
});

vi.mock('../api/escuelas', () => ({
    getEscuelas: vi.fn().mockResolvedValue([]),
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Plus: () => <div />,
        Edit2: () => <div />,
        Trash2: () => <div />,
        Shield: () => <div />,
        Mail: () => <div />,
        Key: () => <div />,
        Briefcase: () => <div />,
        Phone: () => <div />,
        School: () => <div />,
        User: () => <div />,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
        Save: () => <div />,
        Search: () => <div />,
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

const mockUsuarios = [
    {
        id: 1,
        email: 'juan@test.com',
        numero_empleado: 'EMP001',
        role: 'MAESTRO_APOYO',
        nombre: 'Juan',
        apellido_paterno: 'Pérez',
        activo: true,
        escuela: 1,
    },
    {
        id: 2,
        email: 'maria@test.com',
        numero_empleado: 'EMP002',
        role: 'DIRECTOR',
        nombre: 'María',
        apellido_paterno: 'López',
        activo: true,
        escuela: 1,
    },
];

describe('ListaUsuarios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should render usuarios list after loading', async () => {
        (getUsuarios as any).mockResolvedValue({
            count: 2,
            next: null,
            previous: null,
            results: mockUsuarios,
        });

        render(<ListaUsuarios />, { wrapper });

        // Esperar a que los datos se rendericen (React Query resuelve asincrónicamente)
        await waitFor(() => {
            expect(screen.getAllByText('juan@test.com').length).toBeGreaterThan(0);
        });

        // Verificar datos renderizados (usar fuzzy match porque EMP001 está dentro de "Emp: EMP001")
        expect(screen.getAllByText('maria@test.com').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/EMP001/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/EMP002/).length).toBeGreaterThan(0);
    });

    it('should open create modal', async () => {
        (getUsuarios as any).mockResolvedValue({
            count: 0,
            next: null,
            previous: null,
            results: [],
        });

        render(<ListaUsuarios />, { wrapper });

        // Esperar carga y abrir modal
        await waitFor(() => {
            expect(screen.getByText(/Nuevo Usuario/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Nuevo Usuario/i));

        // Verificar que el modal se abrió
        await waitFor(() => {
            expect(screen.getByText(/Cuenta de Acceso/i)).toBeInTheDocument();
        });
    });

    it('should create a new usuario', async () => {
        (getUsuarios as any).mockResolvedValue({
            count: 0,
            next: null,
            previous: null,
            results: [],
        });
        (createUsuario as any).mockResolvedValue({ id: 3 });

        render(<ListaUsuarios />, { wrapper });

        // Esperar carga
        await waitFor(() => {
            expect(screen.getByText(/Nuevo Usuario/i)).toBeInTheDocument();
        });

        // Abrir modal
        fireEvent.click(screen.getByText(/Nuevo Usuario/i));

        // Llenar formulario - esperar que el modal se abra
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/correo@ejemplo.com/i)).toBeInTheDocument();
        });

        // Llenar campos requeridos (Zod: email, nombre, apellido_paterno, role)
        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), { target: { value: 'nuevo@test.com' } });
        fireEvent.change(screen.getByLabelText(/Nombre\(s\)/i), { target: { value: 'NUEVO' } });
        fireEvent.change(screen.getByLabelText(/Apellido Paterno/i), { target: { value: 'TEST' } });

        // Submit - buscar botón "Registrar Usuario"
        const submitButton = screen.getByText(/Registrar Usuario/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createUsuario).toHaveBeenCalled();
        });
    });
});
