import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import RACStudentTimeline from '../pages/rac/RACStudentTimeline';

// ── Mocks ──────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ alumnoId: '1' }),
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../api/rac', () => ({
    getRACByAlumno: vi.fn(),
}));

vi.mock('../api/alumnos', () => ({
    getAlumnos: vi.fn(),
}));

import { getRACByAlumno } from '../api/rac';
import { getAlumnos } from '../api/alumnos';

// ── Datos mock ─────────────────────────────────────

const mockAlumnosResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [
        {
            id: 1,
            nombres: 'Juan',
            apellido_paterno: 'Pérez',
            apellido_materno: 'López',
            curp: 'PELJ090101HDFLSN07',
            edad: 16,
            grado: 3,
            grupo: 'A',
        },
    ],
};

const mockRACRecords = [
    {
        id: 1,
        ciclo_escolar: '2025-2026',
        clasificacion: 'DISCAPACIDAD_MOTRIZ',
        subclasificacion: 'Parálisis Cerebral',
        maestro_nombre: 'Lic. María García',
        escuela_nombre: 'Escuela Primaria Benito Juárez',
        observaciones: 'Muestra avances significativos en motricidad fina.',
    },
    {
        id: 2,
        ciclo_escolar: '2024-2025',
        clasificacion: 'TRASTORNOS',
        subclasificacion: 'TDAH',
        maestro_nombre: 'Lic. Pedro Sánchez',
        escuela_nombre: 'Escuela Primaria Niños Héroes',
        observaciones: null,
    },
];

// ── Helpers ────────────────────────────────────────

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderPage = () => {
    const queryClient = createTestQueryClient();
    return render(
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <RACStudentTimeline />
            </QueryClientProvider>
        </MemoryRouter>
    );
};

// ── Tests ──────────────────────────────────────────

describe('RACStudentTimeline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getAlumnos as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlumnosResponse);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('muestra skeleton mientras carga', () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {})); // never resolves

        renderPage();

        // PageSkeleton se renderiza mientras carga
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('muestra estado vacío cuando no hay registros RAC', async () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Sin Registros RAC')).toBeInTheDocument();
        });

        // Muestra el nombre del alumno en el mensaje
        expect(screen.getByText(/Juan.*no tiene registros RAC/i)).toBeInTheDocument();

        // Botón "Crear Primer Registro RAC"
        const createButton = screen.getByText('Crear Primer Registro RAC');
        expect(createButton).toBeInTheDocument();
    });

    it('renderiza timeline con registros RAC', async () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue(mockRACRecords);

        renderPage();

        // Esperar que se carguen los datos
        await waitFor(() => {
            expect(screen.getByText('Historial de Registros RAC')).toBeInTheDocument();
        });

        // Nombre del alumno en el header
        expect(screen.getByText(/Juan Pérez López/i)).toBeInTheDocument();

        // Datos del alumno
        expect(screen.getByText(/PELJ090101HDFLSN07/)).toBeInTheDocument();
        expect(screen.getByText(/3°/)).toBeInTheDocument(); // grado

        // Ciclos escolares
        expect(screen.getByText('2025-2026')).toBeInTheDocument();
        expect(screen.getByText('2024-2025')).toBeInTheDocument();

        // Clasificaciones
        expect(screen.getByText(/DISCAPACIDAD MOTRIZ/)).toBeInTheDocument();
        expect(screen.getByText(/TDAH/)).toBeInTheDocument();

        // Maestros
        expect(screen.getByText('Lic. María García')).toBeInTheDocument();
        expect(screen.getByText('Lic. Pedro Sánchez')).toBeInTheDocument();

        // Observaciones (solo el primer registro tiene)
        expect(screen.getByText(/avances significativos en motricidad fina/i)).toBeInTheDocument();
    });

    it('navega a /rac/nuevo al hacer click en Nuevo RAC', async () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Nuevo RAC')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nuevo RAC'));

        expect(mockNavigate).toHaveBeenCalledWith('/rac/nuevo?alumno=1');
    });

    it('navega hacia atrás al hacer click en volver', async () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByLabelText('Volver')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Volver'));

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navega a editar RAC al hacer click en Ver / Editar', async () => {
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue(mockRACRecords);

        renderPage();

        await waitFor(() => {
            expect(screen.getAllByText('Ver / Editar').length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getAllByText('Ver / Editar')[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/rac/editar/1');
    });

    it('muestra N/A cuando alumno no tiene datos', async () => {
        (getAlumnos as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0, results: [] });
        (getRACByAlumno as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            // Sin registros pero con CURP N/A porque no hay alumno seleccionado
            expect(screen.getByText('Sin Registros RAC')).toBeInTheDocument();
        });

        // CURP muestra N/A cuando no hay alumno (texto partido en múltiples elementos)
        expect(screen.getByText((content) => content.includes('CURP:'))).toBeInTheDocument();
        const curpElement = screen.getByText((content) => content.includes('CURP:'));
        expect(curpElement.textContent).toContain('N/A');
    });
});
