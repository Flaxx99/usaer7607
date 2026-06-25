import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ListaAlumnos from '../pages/alumnos/ListaAlumnos';
import { getAlumnos, createAlumno, deleteAlumno } from '../api/alumnos';
import { getEscuelas } from '../api/escuelas';
import { getMaestros } from '../api/usuarios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ──
vi.mock('../api/alumnos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/alumnos')>();
    return { ...actual, getAlumnos: vi.fn(), createAlumno: vi.fn(), updateAlumno: vi.fn(), deleteAlumno: vi.fn() };
});

vi.mock('../api/escuelas', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/escuelas')>();
    return { ...actual, getEscuelas: vi.fn() };
});

vi.mock('../api/usuarios', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/usuarios')>();
    return { ...actual, getMaestros: vi.fn() };
});

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Plus: () => <div />,
        Users: () => <div />,
        Search: () => <div />,
        School: () => <div />,
        Filter: () => <div />,
        Sparkles: () => <div />,
        Save: () => <span>Guardar</span>,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
        Pencil: () => <div />,
        Edit2: () => <span data-testid="edit-icon" />,
        Trash2: () => <span data-testid="trash-icon" />,
        AlertTriangle: () => <div />,
        X: () => <div />,
        ChevronLeft: () => <div />,
        ChevronRight: () => <div />,
        FileX: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──
const mockAlumnos = {
    count: 2,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            nombres: 'JUAN',
            apellido_paterno: 'PÉREZ',
            apellido_materno: 'LÓPEZ',
            curp: 'PELJ010101HDFRRT01',
            fecha_nacimiento: '2001-01-01',
            sexo: 'H' as const,
            grado: '1',
            grupo: 'A',
            escuela: 1,
            escuela_detalle: { id: 1, nombre: 'Escuela Test', clave_estatal: 'ET001', nivel: 'PRIMARIA' },
            activo: true,
            clasificacion: 'NINGUNO' as const,
        },
        {
            id: 2,
            nombres: 'MARÍA',
            apellido_paterno: 'GARCÍA',
            apellido_materno: 'HERNÁNDEZ',
            curp: 'GAHM020202MDFRRT02',
            fecha_nacimiento: '2002-02-02',
            sexo: 'M' as const,
            grado: '2',
            grupo: 'B',
            escuela: 2,
            escuela_detalle: { id: 2, nombre: 'Otra Escuela', clave_estatal: 'ET002', nivel: 'PREESCOLAR' },
            activo: true,
            clasificacion: 'DISCAPACIDAD' as const,
        },
    ],
};

const mockEscuelas = [
    { id: 1, nombre: 'Escuela Test', cct: '08DPR0001A', clave_estatal: 'ET001', nivel: 'PRIMARIA', zona: '001', domicilio: 'Calle 1', colonia: 'Centro' },
    { id: 2, nombre: 'Otra Escuela', cct: '08DPR0002B', clave_estatal: 'ET002', nivel: 'PREESCOLAR', zona: '002', domicilio: 'Calle 2', colonia: 'Norte' },
];

const mockMaestros = [
    { id: 1, nombre: 'Pedro', apellido_paterno: 'Martínez', email: 'pedro@test.com', role: 'MAESTRO_APOYO', activo: true },
];

// ── Setup ──
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
);

// ── Tests ──
describe('ListaAlumnos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('renders alumnos list after loading', async () => {
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnos);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);

        render(<ListaAlumnos />, { wrapper });

        // DataTable renders both mobile (card) and desktop (table) views in JSDOM,
        // so text appears twice. Use getAllByText.
        await waitFor(() => {
            expect(screen.getAllByText(/JUAN/).length).toBeGreaterThan(0);
        });

        expect(screen.getAllByText(/PÉREZ/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/MARÍA/).length).toBeGreaterThan(0);
        // Verify CURP is displayed (via badge)
        expect(screen.getAllByText(/PELJ010101HDFRRT01/).length).toBeGreaterThan(0);
    });

    it('shows skeleton while loading', () => {
        vi.mocked(getAlumnos).mockReturnValue(new Promise(() => {})); // never resolves

        render(<ListaAlumnos />, { wrapper });

        // Component renders header + "Nuevo Ingreso" button during loading
        // but NOT error states
        expect(screen.getByText(/Control de Alumnos/i)).toBeInTheDocument();
        expect(screen.queryByText(/Error al cargar los alumnos/i)).not.toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
        vi.mocked(getAlumnos).mockRejectedValue(new Error('Network error'));

        render(<ListaAlumnos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los alumnos/i)).toBeInTheDocument();
        });
    });

    it('opens create modal', async () => {
        vi.mocked(getAlumnos).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);

        render(<ListaAlumnos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Nuevo Ingreso Alumno/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Nuevo Ingreso Alumno/i));

        await waitFor(() => {
            expect(screen.getByText(/Inscripción de Nuevo Alumno/i)).toBeInTheDocument();
        });
    });

    it('opens edit modal with prefilled data', async () => {
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnos);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);

        render(<ListaAlumnos />, { wrapper });

        // Wait for data — text appears twice (mobile + desktop)
        await waitFor(() => {
            expect(screen.getAllByText(/JUAN/).length).toBeGreaterThan(0);
        });

        // Click the first edit button (mobile and desktop views both have them)
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText(/Modificar Ficha de Alumno/i)).toBeInTheDocument();
        });

        // The input should be prefilled with JUAN
        expect(screen.getByDisplayValue(/JUAN/)).toBeInTheDocument();
    });

    it('creates a new alumno via form submission', async () => {
        vi.mocked(getAlumnos).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);
        vi.mocked(createAlumno).mockResolvedValue({ id: 3 } as { id: number });

        const { container } = render(<ListaAlumnos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Nuevo Ingreso Alumno/i)).toBeInTheDocument();
        });

        // Open modal
        fireEvent.click(screen.getByText(/Nuevo Ingreso Alumno/i));

        await waitFor(() => {
            expect(screen.getByText(/Inscripción de Nuevo Alumno/i)).toBeInTheDocument();
        });

        // Fill form using name selectors (react-hook-form register sets name attr in the DOM)
        // These inputs are inside the Modal — only one instance exists
        fireEvent.change(container.querySelector('input[name="nombres"]')!, { target: { value: 'LUIS' } });
        fireEvent.change(container.querySelector('input[name="apellido_paterno"]')!, { target: { value: 'RAMÍREZ' } });
        fireEvent.change(container.querySelector('input[name="curp"]')!, { target: { value: 'RAML030303HDFRRT03' } });
        fireEvent.change(container.querySelector('input[name="fecha_nacimiento"]')!, { target: { value: '2003-03-03' } });
        fireEvent.change(container.querySelector('input[name="grupo"]')!, { target: { value: 'A' } });

        // Select escuela via Controller select
        fireEvent.change(container.querySelector('select[name="escuela"]')!, { target: { value: '1' } });

        // Submit the form
        fireEvent.submit(container.querySelector('form')!);

        await waitFor(() => {
            expect(createAlumno).toHaveBeenCalledTimes(1);
        });

        const payload = vi.mocked(createAlumno).mock.calls[0][0];
        expect(payload).toMatchObject({
            nombres: 'LUIS',
            apellido_paterno: 'RAMÍREZ',
            curp: 'RAML030303HDFRRT03',
            grupo: 'A',
            escuela: 1,
        });
    });

    it('deletes alumno after confirmation', async () => {
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnos);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);
        vi.mocked(deleteAlumno).mockResolvedValue(undefined);

        render(<ListaAlumnos />, { wrapper });

        // Wait for data
        await waitFor(() => {
            expect(screen.getAllByText(/JUAN/).length).toBeGreaterThan(0);
        });

        // Click the first trash button (mobile + desktop both have them)
        const trashButtons = screen.getAllByTestId('trash-icon');
        fireEvent.click(trashButtons[0].closest('button')!);

        // Confirm dialog should appear (heading, not the message p)
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Dar de Baja Alumno/i })).toBeInTheDocument();
        });

        // Click the "Dar de Baja" button in the modal (last matching button)
        // The test has 4 trash buttons (mobile + desktop) and 1 modal confirm button
        fireEvent.click(screen.getAllByRole('button', { name: /Dar de Baja/i }).slice(-1)[0]);

        await waitFor(() => {
            // React Query v5 passes MutationFunctionContext as 2nd arg
            expect(deleteAlumno).toHaveBeenCalledWith(1, expect.anything());
        });
    });

    it('handles empty state', async () => {
        vi.mocked(getAlumnos).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelas);
        vi.mocked(getMaestros).mockResolvedValue(mockMaestros);

        render(<ListaAlumnos />, { wrapper });

        // Empty message appears twice (mobile card + desktop table)
        await waitFor(() => {
            expect(screen.getAllByText(/No se encontraron resultados/i).length).toBeGreaterThan(0);
        });
    });
});
