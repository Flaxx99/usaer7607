import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ListaDocumentos from '../pages/documentos/ListaDocumentos';
import { getDocumentos, createDocumento, deleteDocumento } from '../api/documentos';
import { getAlumnos } from '../api/alumnos';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ──
vi.mock('../api/documentos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/documentos')>();
    return { ...actual, getDocumentos: vi.fn(), createDocumento: vi.fn(), deleteDocumento: vi.fn() };
});

vi.mock('../api/alumnos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/alumnos')>();
    return { ...actual, getAlumnos: vi.fn() };
});

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Plus: () => <div />,
        Search: () => <div />,
        FolderOpen: () => <div />,
        Edit2: () => <span data-testid="edit-icon" />,
        Trash2: () => <span data-testid="trash-icon" />,
        Save: () => <span>Guardar</span>,
        Paperclip: () => <div />,
        X: () => <div />,
        UploadCloud: () => <div />,
        XCircle: () => <div />,
        Pencil: () => <div />,
        AlertTriangle: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──
const mockDocumentos = [
    {
        id: 1,
        alumno: 1,
        alumno_nombre: 'JUAN PÉREZ LÓPEZ',
        profesor_nombre: 'Pedro Martínez',
        informe_deteccion: 'http://example.com/doc1.pdf',
        informe_psicopedagogico: null,
        plan_intervencion: 'http://example.com/plan1.pdf',
        observaciones: 'Pendiente psicopedagógico',
        otros_archivos: [
            { id: 10, archivo: 'extra1.pdf', descripcion: 'Nota médica', url_archivo: 'http://example.com/extra1.pdf', nombre_archivo: 'extra1.pdf' },
        ],
        fecha_subida: '2026-01-15',
    },
    {
        id: 2,
        alumno: 2,
        alumno_nombre: 'MARÍA GARCÍA HERNÁNDEZ',
        profesor_nombre: 'Pedro Martínez',
        informe_deteccion: 'http://example.com/doc2.pdf',
        informe_psicopedagogico: 'http://example.com/psico2.pdf',
        plan_intervencion: 'http://example.com/plan2.pdf',
        observaciones: 'Completo',
        otros_archivos: [],
        fecha_subida: '2026-02-20',
    },
];

const mockAlumnosList = {
    count: 2,
    next: null,
    previous: null,
    results: [
        { id: 1, nombres: 'JUAN', apellido_paterno: 'PÉREZ', apellido_materno: 'LÓPEZ', curp: 'PELJ010101HDFRRT01', sexo: 'H' as const, activo: true, grado: '1', grupo: 'A', escuela: 1, clasificacion: 'NINGUNO' as const },
        { id: 2, nombres: 'MARÍA', apellido_paterno: 'GARCÍA', apellido_materno: 'HERNÁNDEZ', curp: 'GAHM020202MDFRRT02', sexo: 'M' as const, activo: true, grado: '2', grupo: 'B', escuela: 1, clasificacion: 'DISCAPACIDAD' as const },
    ],
};

// ── Setup ──
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
);

// ── Tests ──
describe('ListaDocumentos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('renders documentos list after loading', async () => {
        vi.mocked(getDocumentos).mockResolvedValue(mockDocumentos);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/JUAN PÉREZ LÓPEZ/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/MARÍA GARCÍA HERNÁNDEZ/i)).toBeInTheDocument();
        expect(screen.getByText(/2\/3 Docs/)).toBeInTheDocument();
        expect(screen.getByText(/3\/3 Docs/)).toBeInTheDocument();
        expect(screen.getByText(/1 Anexos/)).toBeInTheDocument();
        expect(screen.getByText(/0 Anexos/)).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
        vi.mocked(getDocumentos).mockReturnValue(new Promise(() => {}));
        vi.mocked(getAlumnos).mockReturnValue(new Promise(() => {}));

        render(<ListaDocumentos />, { wrapper });

        // Component returns early with skeleton during loading
        expect(screen.queryByText(/Documentos y Expedientes/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Nuevo Expediente/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Error al cargar los expedientes/i)).not.toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
        vi.mocked(getDocumentos).mockRejectedValue(new Error('Network error'));

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar los expedientes/i)).toBeInTheDocument();
        });
    });

    it('opens create modal', async () => {
        vi.mocked(getDocumentos).mockResolvedValue(mockDocumentos);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Nuevo Expediente/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Nuevo Expediente/i));

        // Modal title is the same "Nuevo Expediente" text — verify modal form is visible
        await waitFor(() => {
            expect(screen.getByLabelText('Alumno')).toBeInTheDocument();
        });
    });

    it('opens edit modal with prefilled data', async () => {
        vi.mocked(getDocumentos).mockResolvedValue(mockDocumentos);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/JUAN PÉREZ LÓPEZ/i)).toBeInTheDocument();
        });

        // Click the first edit button
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText(/Editar Expediente/i)).toBeInTheDocument();
        });

        // Prefilled observaciones value
        expect(screen.getByDisplayValue(/Pendiente psicopedagógico/i)).toBeInTheDocument();
    });

    it('creates a new documento via form submission', async () => {
        vi.mocked(getDocumentos).mockResolvedValue([]);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);
        vi.mocked(createDocumento).mockResolvedValue({ id: 3 } as { id: number });

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Nuevo Expediente/i)).toBeInTheDocument();
        });

        // Open modal
        fireEvent.click(screen.getByText(/Nuevo Expediente/i));

        await waitFor(() => {
            expect(screen.getByLabelText('Alumno')).toBeInTheDocument();
        });

        // Select an alumno
        fireEvent.change(screen.getByLabelText('Alumno'), { target: { value: '1' } });

        // Fill observaciones
        fireEvent.change(screen.getByLabelText(/Observaciones/i), { target: { value: 'Test observaciones' } });

        // Submit form
        fireEvent.submit(screen.getByLabelText('Alumno').closest('form')!);

        await waitFor(() => {
            expect(createDocumento).toHaveBeenCalledTimes(1);
        });

        const payload = vi.mocked(createDocumento).mock.calls[0][0];
        expect(payload).toMatchObject({
            alumno: 1,
            observaciones: 'Test observaciones',
        });
    });

    it('deletes documento after confirmation', async () => {
        vi.mocked(getDocumentos).mockResolvedValue(mockDocumentos);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);
        vi.mocked(deleteDocumento).mockResolvedValue(undefined);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/JUAN PÉREZ LÓPEZ/i)).toBeInTheDocument();
        });

        // Click the first trash button
        const trashButtons = screen.getAllByTestId('trash-icon');
        fireEvent.click(trashButtons[0].closest('button')!);

        // Confirm dialog appears — "Eliminar Expediente" is the heading
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Eliminar Expediente/i })).toBeInTheDocument();
        });

        // Click confirm button (exact text to avoid matching heading)
        fireEvent.click(screen.getByRole('button', { name: /^Eliminar$/i }));

        await waitFor(() => {
            // React Query v5 passes MutationFunctionContext as 2nd arg
            expect(deleteDocumento).toHaveBeenCalledWith(1, expect.anything());
        });
    });

    it('filters documentos by search', async () => {
        vi.mocked(getDocumentos).mockResolvedValue(mockDocumentos);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/JUAN PÉREZ LÓPEZ/i)).toBeInTheDocument();
        });

        // Type search
        const searchInput = screen.getByPlaceholderText(/Buscar alumno o profesor/i);
        fireEvent.change(searchInput, { target: { value: 'MARÍA' } });

        // After debounce (300ms), only MARÍA should be visible
        await waitFor(() => {
            expect(screen.queryByText(/JUAN PÉREZ LÓPEZ/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/MARÍA GARCÍA HERNÁNDEZ/i)).toBeInTheDocument();
    });

    it('handles empty state', async () => {
        vi.mocked(getDocumentos).mockResolvedValue([]);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosList);

        render(<ListaDocumentos />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/No se encontraron expedientes/i)).toBeInTheDocument();
        });
    });
});
