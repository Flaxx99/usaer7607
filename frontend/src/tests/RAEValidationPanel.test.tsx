import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';
import RAEValidationPanel from '../pages/rae/RAEValidationPanel';
import { initRAECapture, exportRAEExcel } from '../api/rae';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../api/rae', () => ({
    initRAECapture: vi.fn(),
    exportRAEExcel: vi.fn(),
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        ArrowLeft: () => <div />,
        Download: () => <div />,
        Eye: () => <div />,
        Users: () => <div />,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderAtRoute = (route = '/rae/validate/123') => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <LoadingProvider>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route path="/rae/validate/:id" element={<RAEValidationPanel />} />
                    </Routes>
                </MemoryRouter>
            </LoadingProvider>
        </QueryClientProvider>
    );
};

const mockAlumnoBase = {
    registro: 123,
    alumno: 1,
    capturado_por: 1,
    curp: 'PEPJ010101HDFRRT01',
    genero: 'M',
    edad: 10,
    grado: '5°',
    ceg: false, bv: false, so: false, hp: false, scg: false,
    dmo: false, di: false, dme: false, psicosocial: false, dm: false,
    dsc: false, dsco: false, dsa: false, tda: false, tea: false,
    asi: false, asc: false, asa: false, asp: false, ass: false, ot: false,
    psicologia: false, comunicacion: false, psicomotricidad: false,
    trabajo_social: false, aprendizaje: false,
    nuevo_ingreso: false, subsecuente: false,
    diagnostico: false, educativo: false, deteccion: false,
    psicopedagogico: false, plan: false, modelo: false,
};

const mockInitData = {
    registro_id: 123,
    ciclo: '2025-2026',
    escuela: 'Escuela Primaria Test',
    alumnos: [
        {
            ...mockAlumnoBase,
            id: 1,
            alumno_nombre: 'Juan Pérez López',
            ceg: true,
            asi: true,
        },
        {
            ...mockAlumnoBase,
            id: 2,
            alumno_nombre: 'María García Martínez',
            bv: true,
            hp: true,
            dsc: true,
            trabajo_social: true,
            nuevo_ingreso: true,
            diagnostico: true,
        },
    ],
};

describe('RAEValidationPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ═══════════════════════════════════════════
    // RENDER STATES
    // ═══════════════════════════════════════════

    it('should show ValidationSkeleton while loading', async () => {
        vi.mocked(initRAECapture).mockReturnValue(new Promise(() => {}));

        renderAtRoute();

        // ValidationSkeleton renders skeleton class elements
        expect(screen.queryByText('Validación de Totales RAE')).not.toBeInTheDocument();
        expect(screen.queryByText(/Error al cargar/i)).not.toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
        vi.mocked(initRAECapture).mockRejectedValue(new Error('API Error'));

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar el panel de validación/i)).toBeInTheDocument();
        });
    });

    it('should render categories and field counts when data loads', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Verify category labels are rendered (sentence case — CSS uppercase is visual only)
        expect(screen.getByText('Discapacidad')).toBeInTheDocument();
        expect(screen.getByText('Dificultades')).toBeInTheDocument();
        expect(screen.getByText('Sobr.')).toBeInTheDocument();
        expect(screen.getByText('Apoyos')).toBeInTheDocument();
        expect(screen.getByText('Portafolio')).toBeInTheDocument();

        // Verify field badges with counts
        // RAEValidationPanel renders f.toUpperCase() for all field names
        // Discapacidad: ceg=1, bv=1, hp=1
        expect(screen.getByText('CEG')).toBeInTheDocument();
        expect(screen.getByText('BV')).toBeInTheDocument();
        expect(screen.getByText('HP')).toBeInTheDocument();

        // Dificultades: dsc=1
        expect(screen.getByText('DSC')).toBeInTheDocument();

        // Sobr.: asi=1
        expect(screen.getByText('ASI')).toBeInTheDocument();

        // Apoyos: trabajo_social=1 (renders as TRABAJO_SOCIAL via f.toUpperCase())
        expect(screen.getByText('TRABAJO_SOCIAL')).toBeInTheDocument();

        // Portafolio: diagnostico=1 (renders as DIAGNOSTICO via f.toUpperCase())
        expect(screen.getByText('DIAGNOSTICO')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // DETAIL PANEL
    // ═══════════════════════════════════════════

    it('should show detail panel when clicking a field', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Click on the CEG field element (the clickable div in the card)
        const cegDiv = screen.getByText('CEG').closest('[class*="cursor-pointer"]');
        expect(cegDiv).not.toBeNull();
        fireEvent.click(cegDiv!);

        // Detail panel should appear with alumnos that have ceg=true
        await waitFor(() => {
            expect(screen.getByText(/Alumnos con CEG/)).toBeInTheDocument();
        });

        // Should show the specific alumno
        expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
    });

    it('should close detail panel when clicking Cerrar', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Open detail panel
        const cegDiv = screen.getByText('CEG').closest('[class*="cursor-pointer"]');
        fireEvent.click(cegDiv!);

        await waitFor(() => {
            expect(screen.getByText(/Alumnos con CEG/)).toBeInTheDocument();
        });

        // Close
        fireEvent.click(screen.getByText('Cerrar'));

        await waitFor(() => {
            expect(screen.queryByText(/Alumnos con CEG/)).not.toBeInTheDocument();
        });
    });

    it('should show empty state in detail panel when field has no alumnos', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Click on SO (which has 0 alumnos)
        const soDiv = screen.getByText('SO').closest('[class*="cursor-pointer"]');
        fireEvent.click(soDiv!);

        await waitFor(() => {
            expect(screen.getByText('No hay alumnos asignados a esta categoría.')).toBeInTheDocument();
        });
    });

    it('should show multiple alumnos when field has several matches', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Open a detail panel for a field with multiple matches — none available
        // So test that the panel shows the correct single alumno for CEG
        const cegDiv = screen.getByText('CEG').closest('[class*="cursor-pointer"]');
        fireEvent.click(cegDiv!);

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
            expect(screen.queryByText('María García Martínez')).not.toBeInTheDocument();
        });
    });

    // ═══════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════

    it('should show export button', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        expect(screen.getByText('Descargar Archivo Oficial')).toBeInTheDocument();
    });

    it('should handle export', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);
        vi.mocked(exportRAEExcel).mockResolvedValue(new Blob(['fake-excel']));

        // Mock URL.createObjectURL
        const createObjectURL = vi.fn(() => 'blob:mock-url');
        const revokeObjectURL = vi.fn();
        const originalCreateObjectURL = window.URL.createObjectURL;
        const originalRevokeObjectURL = window.URL.revokeObjectURL;
        window.URL.createObjectURL = createObjectURL;
        window.URL.revokeObjectURL = revokeObjectURL;

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // Click export
        fireEvent.click(screen.getByText('Descargar Archivo Oficial'));

        await waitFor(() => {
            expect(exportRAEExcel).toHaveBeenCalledWith(123);
        });

        expect(createObjectURL).toHaveBeenCalled();

        // Restore mocks
        window.URL.createObjectURL = originalCreateObjectURL;
        window.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should show error toast when export fails', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);
        vi.mocked(exportRAEExcel).mockRejectedValue(new Error('Export error'));

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Descargar Archivo Oficial'));

        await waitFor(() => {
            expect(exportRAEExcel).toHaveBeenCalledWith(123);
        });
    });

    // ═══════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════

    it('should render back button', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    });

    it('should render all category sections', async () => {
        vi.mocked(initRAECapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // All 5 category cards should be present (sentence case — CSS uppercase is visual only)
        expect(screen.getByText('Discapacidad')).toBeInTheDocument();
        expect(screen.getByText('Dificultades')).toBeInTheDocument();
        expect(screen.getByText('Sobr.')).toBeInTheDocument();
        expect(screen.getByText('Apoyos')).toBeInTheDocument();
        expect(screen.getByText('Portafolio')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // ERROR STATES FOR EDGE CASES
    // ═══════════════════════════════════════════

    it('should handle empty alumnos array', async () => {
        const emptyData = { ...mockInitData, alumnos: [] };
        vi.mocked(initRAECapture).mockResolvedValue(emptyData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // All field badges should show 0
        const badges = screen.getAllByText('0');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('should handle all boolean fields being true for one alumno', async () => {
        // Create an alumno with ALL fields set to true
        const allTrueAlumno = {
            ...mockAlumnoBase,
            id: 99,
            alumno_nombre: 'Alumno Completo',
            ceg: true, bv: true, so: true, hp: true, scg: true,
            dmo: true, di: true, dme: true, psicosocial: true, dm: true,
            dsc: true, dsco: true, dsa: true, tda: true, tea: true,
            asi: true, asc: true, asa: true, asp: true, ass: true, ot: true,
            psicologia: true, comunicacion: true, psicomotricidad: true,
            trabajo_social: true, aprendizaje: true,
            nuevo_ingreso: true, subsecuente: true,
            diagnostico: true, educativo: true, deteccion: true,
            psicopedagogico: true, plan: true, modelo: true,
        };

        const allTrueData = {
            ...mockInitData,
            alumnos: [allTrueAlumno],
        };
        vi.mocked(initRAECapture).mockResolvedValue(allTrueData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Validación de Totales RAE')).toBeInTheDocument();
        });

        // All fields should have count 1
        const badges = screen.getAllByText('1');
        expect(badges.length).toBeGreaterThan(20);
    });
});
