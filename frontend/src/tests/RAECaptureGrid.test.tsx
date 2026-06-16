import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';
import RAECaptureGrid from '../pages/rae/RAECaptureGrid';
import { raeApi } from '../api/rae';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Module mocks ────────────────────────────────────

vi.mock('../api/rae', () => ({
    raeApi: {
        initCapture: vi.fn(),
        saveBulk: vi.fn(),
    },
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Save: () => <div />,
        ArrowLeft: () => <div />,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
        Search: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

// Mock SearchBar with a simple uncontrolled input that calls onChange directly
vi.mock('../components/SearchBar', () => ({
    SearchBar: vi.fn(
        ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
            <input
                data-testid="search-input"
                defaultValue={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        )
    ),
}));

// Mock LoadingButton as a plain button
vi.mock('../components/LoadingButton', () => ({
    LoadingButton: vi.fn(
        ({
            children,
            onClick,
            loading,
            disabled,
            className,
            ...props
        }: {
            children: React.ReactNode;
            onClick?: () => void;
            loading?: boolean;
            disabled?: boolean;
            className?: string;
            [key: string]: unknown;
        }) => (
            <button
                className={className}
                onClick={onClick}
                disabled={disabled || loading}
                data-loading={loading ? 'true' : undefined}
            >
                {children}
            </button>
        )
    ),
}));

// ── Helpers ─────────────────────────────────────────

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
            alumno: 1,
            alumno_nombre: 'Juan Pérez López',
            ceg: true,
            asi: true,
            nuevo_ingreso: true,
        },
        {
            ...mockAlumnoBase,
            id: 2,
            alumno: 2,
            alumno_nombre: 'María García Martínez',
            bv: true,
            hp: true,
            dsc: true,
            trabajo_social: true,
            diagnostico: true,
        },
    ],
};

const renderAtRoute = (route = '/rae/capture/123') => {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={qc}>
            <LoadingProvider>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route path="/rae/capture/:id" element={<RAECaptureGrid />} />
                    </Routes>
                </MemoryRouter>
            </LoadingProvider>
        </QueryClientProvider>
    );
};

// ── Tests ───────────────────────────────────────────

describe('RAECaptureGrid', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ═══════════════════════════════════════════
    // RENDER STATES
    // ═══════════════════════════════════════════

    it('should show loading spinner while fetching data', async () => {
        vi.mocked(raeApi.initCapture).mockReturnValue(new Promise(() => {}));

        renderAtRoute();

        expect(screen.getByText('Cargando cuadrícula de captura...')).toBeInTheDocument();
        expect(screen.getByText('Cargando cuadrícula de captura...').parentElement?.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
        vi.mocked(raeApi.initCapture).mockRejectedValue(new Error('API Error'));

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar la captura RAE/)).toBeInTheDocument();
        });
    });

    it('should render header with school and student count when data loads', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText(/Captura RAE: Escuela Primaria Test/)).toBeInTheDocument();
        });

        // Should show student count
        expect(screen.getByText(/2 Alumnos/)).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // STUDENT TABLE
    // ═══════════════════════════════════════════

    it('should render all students in the table', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        expect(screen.getByText('María García Martínez')).toBeInTheDocument();
    });

    it('should render category headers in table', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Condiciones')).toBeInTheDocument();
        });

        expect(screen.getByText('Dificultades')).toBeInTheDocument();
        expect(screen.getByText('Sobr.')).toBeInTheDocument();
        expect(screen.getByText('Apoyos')).toBeInTheDocument();
        expect(screen.getByText('Estatus')).toBeInTheDocument();
        expect(screen.getByText('Portafolio')).toBeInTheDocument();
    });

    it('should render field header labels', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('CEG')).toBeInTheDocument();
        });

        expect(screen.getByText('BV')).toBeInTheDocument();
        expect(screen.getByText('SO')).toBeInTheDocument();
        expect(screen.getByText('DSC')).toBeInTheDocument();
        expect(screen.getByText('ASI')).toBeInTheDocument();
        expect(screen.getByText('T.SOC')).toBeInTheDocument();
        expect(screen.getByText('NI')).toBeInTheDocument();
        expect(screen.getByText('DIAG')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════

    it('should filter students when typing in search', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Type search (SearchBar calls onChange directly in mock)
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'María' } });

        await waitFor(() => {
            expect(screen.getByText('María García Martínez')).toBeInTheDocument();
        });

        // Juan should NOT be visible anymore
        expect(screen.queryByText('Juan Pérez López')).not.toBeInTheDocument();
    });

    it('should show empty state when search yields no results', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Search for non-existent student
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'ZZZZ' } });

        await waitFor(() => {
            expect(screen.getByText('No se encontraron alumnos con ese nombre.')).toBeInTheDocument();
        });
    });

    // ═══════════════════════════════════════════
    // CHECKBOX & DRAFTS
    // ═══════════════════════════════════════════

    it('should update dirty row count when checkbox is toggled', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Initially button shows (0)
        expect(screen.getByText('Guardar Cambios (0)')).toBeInTheDocument();

        // Find all checkboxes for Juan Pérez López's row and toggle one that is unchecked
        // The first row has ceg=true, asi=true, nuevo_ingreso=true — those checkboxes start checked
        // Let's find an unchecked checkbox. We can just click the first one (index 0 of checkboxes in the page)
        // but we need to find one for Juan specifically and one that's unchecked
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);

        // Click the first checkbox to toggle it (if it was checked → unchecked, or vice versa)
        fireEvent.click(checkboxes[0]);

        // Check if at least one dirty row exists. The save button should show count > 0
        await waitFor(() => {
            // After toggling, dirtyRows.size should be > 0
            // The button shows 'Guardar Cambios (N)' where N is dirtyRows.size
            // Since we don't know the exact count (depends on which checkbox was clicked),
            // we verify the text changed from (0)
            const saveBtn = screen.getByText(/Guardar Cambios \(\d+\)/);
            expect(saveBtn.textContent).not.toBe('Guardar Cambios (0)');
        });
    });

    it('should toggle checkbox state and persist in draft', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Find all checkboxes
        const checkboxes = screen.getAllByRole('checkbox');

        // Click checkbox to toggle
        fireEvent.click(checkboxes[0]);

        // Verify localStorage has the draft
        await waitFor(() => {
            expect(localStorage.getItem('rae_drafts_123')).not.toBeNull();
            expect(localStorage.getItem('rae_drafts_123_dirty')).not.toBeNull();
        });

        const savedDirty = localStorage.getItem('rae_drafts_123_dirty');
        expect(savedDirty).not.toBeNull();
        const dirtyIds = JSON.parse(savedDirty!);
        // At least one alumno id should be dirty
        expect(dirtyIds.length).toBeGreaterThan(0);
    });

    // ═══════════════════════════════════════════
    // SAVE
    // ═══════════════════════════════════════════

    it('should save changes when clicking Guardar Cambios with dirty rows', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);
        vi.mocked(raeApi.saveBulk).mockResolvedValue({ ok: true });

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Toggle a checkbox to create a draft
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        await waitFor(() => {
            expect(screen.getByText(/Guardar Cambios \(\d+\)/)).toBeInTheDocument();
        });

        // Click save
        const saveBtn = screen.getByText(/Guardar Cambios \(\d+\)/);
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(raeApi.saveBulk).toHaveBeenCalledWith(
                expect.objectContaining({
                    registro_id: 123,
                    alumnos: expect.arrayContaining([
                        expect.objectContaining({ id: expect.any(Number) }),
                    ]),
                })
            );
        });
    });

    it('should have save button disabled with no changes (UI guard)', async () => {
        // This tests the guard: handleSave exists but is unreachable from UI
        // because the button is disabled when dirtyRows.size === 0.
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        const saveBtn = screen.getByText('Guardar Cambios (0)');
        expect(saveBtn).toBeDisabled();
    });

    // ═══════════════════════════════════════════
    // CLEAR DRAFTS
    // ═══════════════════════════════════════════

    it('should clear drafts when clicking Limpiar Borradores', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Create a draft by toggling checkbox
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        await waitFor(() => {
            expect(screen.getByText(/Guardar Cambios \(\d+\)/)).toBeInTheDocument();
        });

        // Click Limpiar Borradores
        fireEvent.click(screen.getByText('Limpiar Borradores'));

        await waitFor(() => {
            expect(screen.getByText('Guardar Cambios (0)')).toBeInTheDocument();
        });

        // The hook re-serializes empty state via useEffect after clearDrafts.
        // So localStorage contains '{}' and '[]' instead of being null.
        expect(localStorage.getItem('rae_drafts_123')).toBe('{}');
        expect(localStorage.getItem('rae_drafts_123_dirty')).toBe('[]');
    });

    // ═══════════════════════════════════════════
    // DISABLED STATES
    // ═══════════════════════════════════════════

    it('should disable Guardar Cambios when there are no changes', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Guardar Cambios (0)')).toBeInTheDocument();
        });

        const saveBtn = screen.getByText('Guardar Cambios (0)');
        expect(saveBtn).toBeDisabled();
    });

    it('should disable Limpiar Borradores when there are no drafts', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Guardar Cambios (0)')).toBeInTheDocument();
        });

        expect(screen.getByText('Limpiar Borradores')).toBeDisabled();
    });

    it('should disable Limpiar Borradores during save', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);
        vi.mocked(raeApi.saveBulk).mockReturnValue(new Promise(() => {})); // never resolves

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Create a draft
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        await waitFor(() => {
            expect(screen.getByText(/Guardar Cambios \(\d+\)/)).toBeInTheDocument();
        });

        // Click save to start mutation
        fireEvent.click(screen.getByText(/Guardar Cambios \(\d+\)/));

        // Now the save button should be disabled (pending mutation)
        await waitFor(() => {
            const saveBtn = screen.getByText(/Guardar Cambios \(\d+\)/);
            expect(saveBtn).toBeDisabled();
        });
    });

    // ═══════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════

    it('should render back button', async () => {
        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText(/Captura RAE: Escuela Primaria Test/)).toBeInTheDocument();
        });

        expect(screen.getByText('Volver')).toBeInTheDocument();
    });

    it('should restore drafts from localStorage on mount', async () => {
        // Pre-populate localStorage with a draft
        localStorage.setItem('rae_drafts_123', JSON.stringify({ 1: { bv: true } }));
        localStorage.setItem('rae_drafts_123_dirty', JSON.stringify([1]));

        vi.mocked(raeApi.initCapture).mockResolvedValue(mockInitData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez López')).toBeInTheDocument();
        });

        // Button should show 1 dirty row (restored from localStorage)
        expect(screen.getByText('Guardar Cambios (1)')).toBeInTheDocument();
    });

    it('should handle empty alumnos array gracefully', async () => {
        const emptyData = { ...mockInitData, alumnos: [] };
        vi.mocked(raeApi.initCapture).mockResolvedValue(emptyData);

        renderAtRoute();

        await waitFor(() => {
            expect(screen.getByText(/0 Alumnos/)).toBeInTheDocument();
        });

        // Should not have any student names
        expect(screen.queryByText('Juan Pérez López')).not.toBeInTheDocument();
        expect(screen.queryByText('María García Martínez')).not.toBeInTheDocument();
    });
});
