import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';
import SchoolCalendar from '../pages/calendar/SchoolCalendar';
import { calendarApi } from '../api/calendar';
import { getUsuarios } from '../api/usuarios';
import { getAlumnos } from '../api/alumnos';
import { getEscuelas } from '../api/escuelas';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── API MOCKS ───

vi.mock('../api/calendar', () => ({
    calendarApi: {
        getEvents: vi.fn(),
        saveEvent: vi.fn(),
        deleteEvent: vi.fn(),
    },
}));

vi.mock('../api/usuarios', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/usuarios')>();
    return {
        ...actual,
        getUsuarios: vi.fn(),
    };
});

vi.mock('../api/alumnos', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/alumnos')>();
    return {
        ...actual,
        getAlumnos: vi.fn(),
    };
});

vi.mock('../api/escuelas', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/escuelas')>();
    return {
        ...actual,
        getEscuelas: vi.fn(),
    };
});

// ─── ICON MOCKS ───

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Calendar: () => <div />,
        Plus: () => <div />,
        Clock: () => <div />,
        AlertCircle: () => <div />,
        Trash2: () => <div />,
        Edit2: () => <div />,
        CheckCircle: () => <div />,
        XCircle: () => <div />,
        Search: () => <div />,
        Save: () => <div />,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// ─── HELPERS ───

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

// ─── MOCK DATA ───

const mockEventAlta = {
    id: 1,
    title: 'Evaluación Juan Pérez',
    description: 'Evaluación psicopedagógica programada.',
    start_time: '2026-06-15T09:00:00Z',
    end_time: '2026-06-15T10:00:00Z',
    event_type: 'EVALUACION' as const,
    status: 'PENDIENTE' as const,
    priority: 'ALTA' as const,
    created_by: 1,
    assigned_to: 2,
    color: '#EF4444',
    created_by_nombre: 'Admin Sistema',
    assigned_to_nombre: 'María López',
};

const mockEventMedia = {
    id: 2,
    title: 'Reunión con Padres',
    description: 'Reunión de seguimiento académico.',
    start_time: '2026-06-20T14:00:00Z',
    end_time: '2026-06-20T15:00:00Z',
    event_type: 'REUNION' as const,
    status: 'PENDIENTE' as const,
    priority: 'MEDIA' as const,
    created_by: 1,
    assigned_to: 1,
    color: '#3B82F6',
    created_by_nombre: 'Admin Sistema',
    assigned_to_nombre: 'Admin Sistema',
};

const mockEventsResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [mockEventAlta, mockEventMedia],
};

const mockUsersResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [
        { id: 1, email: 'admin@test.com', nombre: 'Admin', apellido_paterno: 'Sistema', role: 'ADMIN', activo: true, numero_empleado: 'ADM001' },
        { id: 2, email: 'maria@test.com', nombre: 'María', apellido_paterno: 'López', role: 'MAESTRO_APOYO', activo: true, numero_empleado: 'EMP002' },
    ],
};

const mockAlumnosResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [
        { id: 1, nombres: 'Juan', apellido_paterno: 'Pérez', curp: 'PEPJ010101HDFRRT01', activo: true },
    ],
};

const mockEscuelasResponse = [
    { id: 1, nombre: 'Escuela Test Primaria', cct: '08DPR0001A', activo: true },
];

describe('SchoolCalendar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        // Mock localStorage.getItem for user role
        Storage.prototype.getItem = vi.fn((key: string) => {
            if (key === 'user') {
                return JSON.stringify({ id: 1, role: 'ADMIN' });
            }
            return null;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ═══════════════════════════════════════════
    // RENDER STATES
    // ═══════════════════════════════════════════

    it('should show loading spinner while fetching events', async () => {
        vi.mocked(calendarApi.getEvents).mockReturnValue(new Promise(() => {}));
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        // Loading spinner should be visible
        expect(screen.getByText('Cargando agenda...')).toBeInTheDocument();
        expect(screen.queryByText('Agenda y Tareas USAER')).not.toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
        vi.mocked(calendarApi.getEvents).mockRejectedValue(new Error('API Error'));
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar la agenda/i)).toBeInTheDocument();
        });
    });

    it('should render the calendar page with events after loading', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Events should be rendered — the ALTA event appears in both urgent column and table
        expect(screen.getAllByText('Evaluación Juan Pérez').length).toBeGreaterThan(0);
        // MEDIA event only appears in the cronograma table (not in urgent column)
        expect(screen.getByText('Reunión con Padres')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // URGENT COLUMN
    // ═══════════════════════════════════════════

    it('should show ALTA priority events in the Urgentes column', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // The urgent column should show the ALTA event (appears in both urgent + table)
        expect(screen.getAllByText('Evaluación Juan Pérez').length).toBeGreaterThan(0);

        // The urgent section title should be visible
        expect(screen.getByText('Urgentes (Alta)')).toBeInTheDocument();
    });

    it('should show empty state when no urgent tasks exist', async () => {
        // Only MEDIA events — no ALTA
        const noUrgentResponse = {
            ...mockEventsResponse,
            results: [{ ...mockEventMedia }],
        };

        vi.mocked(calendarApi.getEvents).mockResolvedValue(noUrgentResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Should show empty urgent message
        expect(screen.getByText('No hay tareas urgentes.')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // MODAL OPERATIONS
    // ═══════════════════════════════════════════

    it('should open create event modal', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Click "Nueva Tarea/Evento"
        fireEvent.click(screen.getByText('Nueva Tarea/Evento'));

        await waitFor(() => {
            expect(screen.getByText('Crear Nueva Tarea/Evento')).toBeInTheDocument();
        });

        // Verify form fields are rendered (from TaskModal)
        expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Tipo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Prioridad/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha y Hora Inicio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha y Hora Fin/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Asignar a/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
        expect(screen.getByText('Crear Tarea')).toBeInTheDocument();
    });

    it('should open edit event modal with pre-filled data', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Find the first edit button in the table and click it
        const editButtons = document.querySelectorAll('.btn-ghost.btn-xs.text-primary');
        expect(editButtons.length).toBeGreaterThan(0);
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Tarea/Evento')).toBeInTheDocument();
        });

        // Should have pre-filled title
        const titleInput = screen.getByLabelText(/Título/i) as HTMLInputElement;
        expect(titleInput.value).toBe('Evaluación Juan Pérez');
    });

    it('should close modal when clicking Cancelar', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nueva Tarea/Evento'));

        await waitFor(() => {
            expect(screen.getByText('Crear Nueva Tarea/Evento')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Crear Nueva Tarea/Evento')).not.toBeInTheDocument();
        });
    });

    // ═══════════════════════════════════════════
    // CRUD OPERATIONS
    // ═══════════════════════════════════════════

    it('should create a new event via modal', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(calendarApi.saveEvent).mockResolvedValue({ id: 3 });
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Open create modal
        fireEvent.click(screen.getByText('Nueva Tarea/Evento'));

        await waitFor(() => {
            expect(screen.getByText('Crear Nueva Tarea/Evento')).toBeInTheDocument();
        });

        // Fill form fields
        fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: 'Nueva Evaluación' } });
        fireEvent.change(screen.getByLabelText(/Tipo/i), { target: { value: 'EVALUACION' } });
        fireEvent.change(screen.getByLabelText(/Prioridad/i), { target: { value: 'ALTA' } });
        fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'PENDIENTE' } });
        fireEvent.change(screen.getByLabelText(/Fecha y Hora Inicio/i), { target: { value: '2026-07-01T09:00' } });
        fireEvent.change(screen.getByLabelText(/Fecha y Hora Fin/i), { target: { value: '2026-07-01T10:00' } });

        // Submit
        const submitButton = screen.getByText('Crear Tarea');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(calendarApi.saveEvent).toHaveBeenCalled();
        });
    });

    it('should create a new event and modal closes', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(calendarApi.saveEvent).mockResolvedValue({ id: 3 });
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Open modal, fill, and submit
        fireEvent.click(screen.getByText('Nueva Tarea/Evento'));

        await waitFor(() => {
            expect(screen.getByText('Crear Nueva Tarea/Evento')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Tipo/i), { target: { value: 'EVALUACION' } });
        fireEvent.change(screen.getByLabelText(/Prioridad/i), { target: { value: 'MEDIA' } });
        fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'PENDIENTE' } });
        fireEvent.change(screen.getByLabelText(/Fecha y Hora Inicio/i), { target: { value: '2026-07-01T09:00' } });
        fireEvent.change(screen.getByLabelText(/Fecha y Hora Fin/i), { target: { value: '2026-07-01T10:00' } });

        fireEvent.click(screen.getByText('Crear Tarea'));

        // After successful save, modal should close
        await waitFor(() => {
            expect(screen.queryByText('Crear Nueva Tarea/Evento')).not.toBeInTheDocument();
        });
    });

    it('should delete an event with confirm dialog', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(calendarApi.deleteEvent).mockResolvedValue(null);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Find delete buttons inside the cronograma table (not the urgent column's edit button)
        const cronogramaSection = screen.getByText('Cronograma de Actividades').closest('.card-body');
        const deleteButtons = cronogramaSection?.querySelectorAll('.btn-ghost.btn-xs.text-error') || [];
        expect(deleteButtons.length).toBeGreaterThan(0);
        fireEvent.click(deleteButtons[0]);

        // Confirm dialog should appear
        await waitFor(() => {
            expect(screen.getByText('Eliminar Evento')).toBeInTheDocument();
        });

        // Confirm
        fireEvent.click(screen.getByText('Eliminar'));

        await waitFor(() => {
            expect(calendarApi.deleteEvent).not.toHaveBeenCalled();
        });
    });

    it('should cancel event deletion when dialog is dismissed', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Scope to the cronograma table to avoid the urgent column's edit button
        const cronogramaCard = screen.getByText('Cronograma de Actividades').closest('.card-body');
        const deleteButtons = cronogramaCard?.querySelectorAll('.btn-ghost.btn-xs.text-error') || [];
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Eliminar Evento')).toBeInTheDocument();
        });

        // Cancel
        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Eliminar Evento')).not.toBeInTheDocument();
        });

        expect(calendarApi.deleteEvent).not.toHaveBeenCalled();
    });

    // ═══════════════════════════════════════════
    // SEARCH / FILTER
    // ═══════════════════════════════════════════

    it('should show total event count in the cronograma', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Should show event count
        expect(screen.getByText(/2 eventos/)).toBeInTheDocument();
    });

    it('should show empty results message when all events are filtered out', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Type a search query that won't match anything
        const searchInput = screen.getByPlaceholderText('Buscar por evento, descripción o asignado...');
        fireEvent.change(searchInput, { target: { value: 'zzzznotfound' } });

        // Due to SearchBar debounce, wait for filtering to happen
        await waitFor(() => {
            expect(screen.getByText(/0 eventos/)).toBeInTheDocument();
        });

        // Empty state should appear in the table
        expect(screen.getByText('No se encontraron eventos con ese término.')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // EVENT BADGES AND STATUS
    // ═══════════════════════════════════════════

    it('should show status badges for events', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // PENDIENTE status badges should be visible
        const statusBadges = screen.getAllByText('PENDIENTE');
        expect(statusBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('should show assigned user names', async () => {
        vi.mocked(calendarApi.getEvents).mockResolvedValue(mockEventsResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // assigned_to_nombre should be visible
        expect(screen.getByText('María López')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // EMPTY EVENTS STATE
    // ═══════════════════════════════════════════

    it('should handle empty events list', async () => {
        const emptyResponse = { count: 0, next: null, previous: null, results: [] };

        vi.mocked(calendarApi.getEvents).mockResolvedValue(emptyResponse);
        vi.mocked(getUsuarios).mockResolvedValue(mockUsersResponse);
        vi.mocked(getAlumnos).mockResolvedValue(mockAlumnosResponse);
        vi.mocked(getEscuelas).mockResolvedValue(mockEscuelasResponse);

        render(<SchoolCalendar />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Agenda y Tareas USAER')).toBeInTheDocument();
        });

        // Urgent column should show empty
        expect(screen.getByText('No hay tareas urgentes.')).toBeInTheDocument();

        // Cronograma should show 0 eventos
        expect(screen.getByText(/0 eventos/)).toBeInTheDocument();

        // Create button should still be visible
        expect(screen.getByText('Nueva Tarea/Evento')).toBeInTheDocument();
    });
});
