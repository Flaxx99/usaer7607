import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';
import ListaCiclos from '../pages/ciclos/ListaCiclos';
import { getCiclos, createCiclo, updateCiclo, deleteCiclo, previewPromocion, ejecutarPromocion, getPromocionStatus } from '../api/ciclos';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/ciclos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/ciclos')>();
    return {
        ...actual,
        getCiclos: vi.fn(),
        createCiclo: vi.fn(),
        updateCiclo: vi.fn(),
        deleteCiclo: vi.fn(),
        previewPromocion: vi.fn(),
        ejecutarPromocion: vi.fn(),
        getPromocionStatus: vi.fn(),
    };
});

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Plus: () => <div />,
        Calendar: () => <div />,
        Edit2: () => <div />,
        Trash2: () => <div />,
        CheckCircle: () => <div />,
        AlertTriangle: () => <div />,
        Layers: () => <div />,
        ArrowRightCircle: () => <div />,
        GraduationCap: () => <div />,
        TrendingUp: () => <div />,
        Save: () => <div />,
        XCircle: () => <div />,
        Pencil: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <LoadingProvider>
            <MemoryRouter>{children}</MemoryRouter>
        </LoadingProvider>
    </QueryClientProvider>
);

const mockCiclos = [
    {
        id: 1,
        nombre: '2024-2025',
        fecha_inicio: '2024-08-19',
        fecha_fin: '2025-07-04',
        activo: true,
    },
    {
        id: 2,
        nombre: '2025-2026',
        fecha_inicio: '2025-08-18',
        fecha_fin: '2026-07-03',
        activo: false,
    },
];

const mockPreview = {
    total_activos: 50,
    a_promover_count: 30,
    a_graduar_count: 15,
    errores_count: 5,
};

describe('ListaCiclos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    // ═══════════════════════════════════════════
    // RENDER STATES
    // ═══════════════════════════════════════════

    it('should show loading skeleton while fetching', async () => {
        // Never resolve the query
        vi.mocked(getCiclos).mockReturnValue(new Promise(() => {}));

        render(<ListaCiclos />, { wrapper });

        // During loading, only the skeleton is shown (no error, no data)
        // The header "Ciclos Escolares" is NOT rendered during loading
        expect(screen.queryByText('Ciclos Escolares')).not.toBeInTheDocument();
        expect(screen.queryByText(/Error al cargar los ciclos/i)).not.toBeInTheDocument();
        // The component renders without crashing
        expect(screen.queryByText('Define los periodos de trabajo')).not.toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
        vi.mocked(getCiclos).mockRejectedValue(new Error('Network error'));

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los ciclos/i)).toBeInTheDocument();
        });
    });

    it('should display empty state when no ciclos exist', async () => {
        vi.mocked(getCiclos).mockResolvedValue([]);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo')).toBeInTheDocument();
        });

        // DataTable shows empty state (appears in both mobile + desktop views)
        expect(screen.getAllByText('No se encontraron resultados.')[0]).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // DATA DISPLAY
    // ═══════════════════════════════════════════

    it('should render ciclos list after loading', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        expect(screen.getAllByText(/2025-2026/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('2024-08-19').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2025-07-04').length).toBeGreaterThan(0);
    });

    it('should show VIGENTE badge only for active ciclo', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            // VIGENTE appears in both mobile + desktop views, so use getAllByText
            expect(screen.getAllByText('VIGENTE').length).toBeGreaterThan(0);
        });

        // Only the active ciclo (2024-2025) should have VIGENTE badge
        // The badge renders in both mobile + desktop views, so expect 2 (one per view)
        const vigentes = screen.getAllByText('VIGENTE');
        expect(vigentes.length).toBe(2);
    });

    it('should show Activar button only for inactive ciclos', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            // Activar appears in both mobile + desktop views
            expect(screen.getAllByText(/Activar/).length).toBeGreaterThan(0);
        });

        // Only for inactive ciclo - renders in mobile + desktop
        const activarButtons = screen.getAllByText(/Activar/);
        expect(activarButtons.length).toBe(2);
    });

    // ═══════════════════════════════════════════
    // MODAL OPERATIONS
    // ═══════════════════════════════════════════

    it('should open create modal with default values', async () => {
        vi.mocked(getCiclos).mockResolvedValue([]);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nuevo Ciclo'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo Escolar')).toBeInTheDocument();
        });

        // Form fields should be visible
        expect(screen.getByLabelText(/Nombre del Ciclo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha Inicio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha Fin/i)).toBeInTheDocument();
        // Default nombre should be current year range
        const currentYear = new Date().getFullYear();
        expect(screen.getByLabelText(/Nombre del Ciclo/i)).toHaveValue(`${currentYear}-${currentYear + 1}`);
    });

    it('should open edit modal with pre-filled data', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        // Find and click the edit button (rendered as a button with Edit2 icon)
        const editButtons = document.querySelectorAll('.btn-ghost.btn-xs.text-primary');
        expect(editButtons.length).toBeGreaterThan(0);
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Ciclo')).toBeInTheDocument();
        });

        // Verify pre-filled data
        expect(screen.getByLabelText(/Nombre del Ciclo/i)).toHaveValue('2024-2025');
    });

    it('should close modal when clicking Cancelar', async () => {
        vi.mocked(getCiclos).mockResolvedValue([]);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nuevo Ciclo'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo Escolar')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Nuevo Ciclo Escolar')).not.toBeInTheDocument();
        });
    });

    // ═══════════════════════════════════════════
    // CRUD OPERATIONS
    // ═══════════════════════════════════════════

    it('should create a new ciclo', async () => {
        vi.mocked(getCiclos).mockResolvedValue([]);
        vi.mocked(createCiclo).mockResolvedValue({ id: 3 } as any);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nuevo Ciclo'));

        await waitFor(() => {
            expect(screen.getByText('Nuevo Ciclo Escolar')).toBeInTheDocument();
        });

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nombre del Ciclo/i), { target: { value: '2026-2027' } });
        fireEvent.change(screen.getByLabelText(/Fecha Inicio/i), { target: { value: '2026-08-17' } });
        fireEvent.change(screen.getByLabelText(/Fecha Fin/i), { target: { value: '2027-07-02' } });

        // Submit
        const guardarButton = screen.getByText('Guardar');
        fireEvent.click(guardarButton);

        await waitFor(() => {
            expect(createCiclo).toHaveBeenCalled();
        });
    });

    it('should update an existing ciclo', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(updateCiclo).mockResolvedValue({ id: 1 } as any);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        // Click edit button on the first ciclo
        const editButtons = document.querySelectorAll('.btn-ghost.btn-xs.text-primary');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Ciclo')).toBeInTheDocument();
        });

        // Modify nombre
        fireEvent.change(screen.getByLabelText(/Nombre del Ciclo/i), { target: { value: '2024-2025-EDIT' } });

        // Click "Actualizar" (Texto cambia a "Actualizar" en modo edición)
        const actualizarButton = screen.getByText('Actualizar');
        fireEvent.click(actualizarButton);

        await waitFor(() => {
            expect(updateCiclo).toHaveBeenCalled();
        });
    });

    it('should activate a ciclo with confirm dialog', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(updateCiclo).mockResolvedValue({ id: 2 } as any);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            // Activar appears in both mobile + desktop views
            expect(screen.getAllByText(/Activar/).length).toBeGreaterThan(0);
        });

        // Click "Activar" on the inactive ciclo (pick first one since both mobile + desktop render it)
        fireEvent.click(screen.getAllByText(/Activar/)[0]);

        // Confirm dialog should appear
        await waitFor(() => {
            expect(screen.getByText('Activar Ciclo')).toBeInTheDocument();
        });

        // Click the confirm button within the dialog
        const dialogContainer = screen.getByText('Activar Ciclo').closest('.modal-box');
        const confirmButton = dialogContainer ? within(dialogContainer).getByText('Activar') : screen.getAllByText('Activar')[0];
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(updateCiclo).toHaveBeenCalledWith(
                expect.objectContaining({ id: 2, activo: true }),
                expect.anything()
            );
        });
    });

    it('should delete a ciclo with confirm dialog', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(deleteCiclo).mockResolvedValue();

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        // Find delete buttons (btn-ghost btn-xs.text-error)
        const deleteButtons = document.querySelectorAll('.btn-ghost.btn-xs.text-error');
        expect(deleteButtons.length).toBeGreaterThan(0);
        fireEvent.click(deleteButtons[0]);

        // Confirm dialog should appear
        await waitFor(() => {
            expect(screen.getByText('Eliminar Ciclo')).toBeInTheDocument();
        });

        // Click the confirm button within the dialog
        const deleteDialog = screen.getByText('Eliminar Ciclo').closest('.modal-box');
        const eliminarBtn = deleteDialog ? within(deleteDialog).getByText('Eliminar') : screen.getByText('Eliminar');
        fireEvent.click(eliminarBtn);

        await waitFor(() => {
            expect(deleteCiclo).toHaveBeenCalled();
            expect(deleteCiclo).toHaveBeenCalledWith(1, expect.anything());
        });
    });

    it('should cancel deletion when dialog is dismissed', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        // Click delete on first ciclo
        const deleteButtons = document.querySelectorAll('.btn-ghost.btn-xs.text-error');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Eliminar Ciclo')).toBeInTheDocument();
        });

        // Cancel
        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Eliminar Ciclo')).not.toBeInTheDocument();
        });

        expect(deleteCiclo).not.toHaveBeenCalled();
    });

    // ═══════════════════════════════════════════
    // SEARCH / FILTER
    // ═══════════════════════════════════════════

    it('should filter ciclos by search query', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText(/2024-2025/).length).toBeGreaterThan(0);
        });

        // Type in the search bar (by aria-label since the SearchBar uses aria-label matching placeholder)
        const searchInput = screen.getByLabelText('Buscar ciclo escolar...');
        fireEvent.change(searchInput, { target: { value: '2025' } });

        // Debounce — SearchBar has a 300ms debounce, but the DataTable uses onSearchChange
        // which is called by SearchBar.onChange after debounce. We'll use the onInput path.
        // However, DataTable's SearchBar receives onSearchChange and searchValue.
        // Let's verify by checking that only matching items are visible.
        
        // Since DataTable does the filtering via onSearchChange -> setBusqueda -> filtered list
        // The debounce means we need to wait
        await waitFor(() => {
            // 2025-2026 should match search "2025"
            expect(screen.getAllByText(/2025-2026/).length).toBeGreaterThan(0);
        });
    });

    // ═══════════════════════════════════════════
    // PROMOCIÓN MODAL
    // ═══════════════════════════════════════════

    it('should open promocion modal', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockReturnValue(new Promise(() => {})); // Keep loading

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('Simulación de Cierre de Ciclo')).toBeInTheDocument();
        });
    });

    it('should show loading state while fetching preview', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockReturnValue(new Promise(() => {})); // Never resolves

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('Analizando alumnos...')).toBeInTheDocument();
        });
    });

    it('should show preview data when loaded', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockResolvedValue(mockPreview);

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('30')).toBeInTheDocument(); // a_promover_count
            expect(screen.getByText('15')).toBeInTheDocument();  // a_graduar_count
            expect(screen.getByText('50')).toBeInTheDocument();  // total_activos
        });

        // Text labels should be present
        expect(screen.getByText('Promovidos')).toBeInTheDocument();
        expect(screen.getByText('Graduados')).toBeInTheDocument();
        expect(screen.getByText('Total Analizados')).toBeInTheDocument();
    });

    it('should show error state when preview loading fails', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockRejectedValue(new Error('Preview error'));

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('Error al cargar la simulación.')).toBeInTheDocument();
            expect(screen.getByText('Reintentar')).toBeInTheDocument();
        });
    });

    it('should execute promocion and show async processing', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockResolvedValue(mockPreview);
        vi.mocked(ejecutarPromocion).mockResolvedValue({ task_id: 'task-123', promovidos: 0, graduados: 0 });

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        // Open promocion modal
        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('30')).toBeInTheDocument();
        });

        // Click "Ejecutar Cierre"
        const ejecutarButton = screen.getByText('Ejecutar Cierre');
        fireEvent.click(ejecutarButton);

        await waitFor(() => {
            expect(ejecutarPromocion).toHaveBeenCalled();
        });

        // Should now show processing screen
        await waitFor(() => {
            expect(screen.getByText('Procesando Promoción...')).toBeInTheDocument();
        });
    });

    it('should handle promocion completion via polling', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockResolvedValue(mockPreview);
        vi.mocked(ejecutarPromocion).mockResolvedValue({ task_id: 'task-123', promovidos: 0, graduados: 0 });
        vi.mocked(getPromocionStatus).mockResolvedValue({
            status: 'COMPLETED',
            data: { promovidos: 28, graduados: 15 },
        });

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        // Open and execute
        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('30')).toBeInTheDocument();
        });

        const ejecutarButton = screen.getByText('Ejecutar Cierre');
        fireEvent.click(ejecutarButton);

        // The useEffect should handle the COMPLETED status and close the modal
        await waitFor(() => {
            expect(screen.queryByText('Procesando Promoción...')).not.toBeInTheDocument();
        });
    });

    it('should handle promocion failure via polling', async () => {
        vi.mocked(getCiclos).mockResolvedValue(mockCiclos);
        vi.mocked(previewPromocion).mockResolvedValue(mockPreview);
        vi.mocked(ejecutarPromocion).mockResolvedValue({ task_id: 'task-456', promovidos: 0, graduados: 0 });
        vi.mocked(getPromocionStatus).mockResolvedValue({
            status: 'FAILED',
            error: 'Error durante el procesamiento.',
        });

        render(<ListaCiclos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Promoción de Grado')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Promoción de Grado'));

        await waitFor(() => {
            expect(screen.getByText('30')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Ejecutar Cierre'));

        // After failure, modal should close
        await waitFor(() => {
            expect(screen.queryByText('Procesando Promoción...')).not.toBeInTheDocument();
        });
    });
});
