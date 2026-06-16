import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import TaskModal from '../pages/calendar/TaskModal';
import { vi, describe, it, expect } from 'vitest';

// ── Mocks ────────────────────────────────────────────

vi.mock('../../components/Modal', () => ({
    default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
        isOpen ? (
            <div data-testid="modal-wrapper">
                <h2>{title}</h2>
                {children}
            </div>
        ) : null,
}));

vi.mock('../../components/LoadingButton', () => ({
    LoadingButton: ({
        children,
        onClick,
        loading,
        type,
        className,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        loading?: boolean;
        type?: 'button' | 'submit';
        className?: string;
    }) => (
        <button
            type={type || 'button'}
            className={className}
            onClick={onClick}
            disabled={loading}
            data-loading={loading ? 'true' : undefined}
        >
            {children}
        </button>
    ),
}));

vi.mock('lucide-react', () => ({
    Calendar: () => <div data-testid="icon-calendar" />,
    Save: () => <div data-testid="icon-save" />,
    X: () => <div data-testid="icon-x" />,
}));

// ── Helpers ──────────────────────────────────────────

const mockUsers = [
    { id: 1, first_name: 'Admin', last_name: 'User', numero_empleado: '001' },
    { id: 2, first_name: 'Teacher', last_name: 'One', numero_empleado: '002' },
];

const mockAlumnos = [
    { id: 10, nombres: 'Juan', apellido_paterno: 'Pérez', curp: '...' },
    { id: 11, nombres: 'María', apellido_paterno: 'García', curp: '...' },
];

const mockEscuelas = [
    { id: 20, nombre: 'Escuela Primaria Test' },
    { id: 21, nombre: 'Escuela Secundaria Demo' },
];

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    users: mockUsers,
    alunos: mockAlumnos,
    escuelas: mockEscuelas,
    currentUserRole: 'MAESTRO_APOYO',
    saving: false,
    initialData: null,
};

// ── Tests ────────────────────────────────────────────

describe('TaskModal', () => {
    it('renders nothing when opened is false', () => {
        render(<TaskModal {...defaultProps} opened={false} />);
        expect(screen.queryByTestId('modal-wrapper')).not.toBeInTheDocument();
    });

    it('renders create title when no initialData', () => {
        render(<TaskModal {...defaultProps} />);
        expect(screen.getByText('Crear Nueva Tarea/Evento')).toBeInTheDocument();
    });

    it('renders edit title when initialData is provided', () => {
        render(
            <TaskModal
                {...defaultProps}
                initialData={{
                    id: 1,
                    title: 'Revisión de expedientes',
                    event_type: 'TAREA',
                    priority: 'ALTA',
                    status: 'PENDIENTE',
                    start_time: '2026-06-15T09:00',
                    end_time: '2026-06-15T10:00',
                    assigned_to: 2,
                    created_by: 1,
                    description: '',
                    color: '#3B82F6',
                }}
            />
        );
        expect(screen.getByText('Editar Tarea/Evento')).toBeInTheDocument();
        // Form should be pre-filled
        const titleInput = screen.getByPlaceholderText('Ej. Revisión de expediente...');
        expect(titleInput).toHaveValue('Revisión de expedientes');
    });

    it('renders all form fields', () => {
        render(<TaskModal {...defaultProps} />);

        expect(screen.getByLabelText('Título')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
        expect(screen.getByLabelText('Prioridad')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha y Hora Inicio')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha y Hora Fin')).toBeInTheDocument();
        expect(screen.getByLabelText('Asignar a')).toBeInTheDocument();
        expect(screen.getByLabelText('Estado')).toBeInTheDocument();
        expect(screen.getByLabelText('Alumno Relacionado')).toBeInTheDocument();
        expect(screen.getByLabelText('Escuela Relacionada')).toBeInTheDocument();
        expect(screen.getByLabelText('Color del Evento:')).toBeInTheDocument();
    });

    it('renders type options', () => {
        render(<TaskModal {...defaultProps} />);
        const tipo = screen.getByLabelText('Tipo') as HTMLSelectElement;
        expect(tipo.options.length).toBe(5);
        expect(tipo.options[0].value).toBe('EVALUACION');
        expect(tipo.options[1].value).toBe('REUNION');
    });

    it('renders priority options', () => {
        render(<TaskModal {...defaultProps} />);
        const priority = screen.getByLabelText('Prioridad') as HTMLSelectElement;
        expect(priority.options.length).toBe(3);
        expect(priority.options[0].value).toBe('BAJA');
        expect(priority.options[1].value).toBe('MEDIA');
        expect(priority.options[2].value).toBe('ALTA');
    });

    it('renders status options', () => {
        render(<TaskModal {...defaultProps} />);
        const status = screen.getByLabelText('Estado') as HTMLSelectElement;
        expect(status.options.length).toBe(3);
        expect(status.options[0].value).toBe('PENDIENTE');
        expect(status.options[1].value).toBe('COMPLETADO');
        expect(status.options[2].value).toBe('CANCELADO');
    });

    it('renders user options in assigned_to select', () => {
        render(<TaskModal {...defaultProps} />);
        const assign = screen.getByLabelText('Asignar a') as HTMLSelectElement;
        // First option is placeholder "Seleccionar responsable"
        expect(assign.options[0].value).toBe('');
        expect(assign.options[1].text).toBe('Admin User');
        expect(assign.options[2].text).toBe('Teacher One');
    });

    it('renders alumno options', () => {
        render(<TaskModal {...defaultProps} />);
        const alumno = screen.getByLabelText('Alumno Relacionado') as HTMLSelectElement;
        expect(alumno.options[0].value).toBe('');
        expect(alumno.options[1].text).toBe('Juan Pérez');
    });

    it('renders escuela options', () => {
        render(<TaskModal {...defaultProps} />);
        const escuela = screen.getByLabelText('Escuela Relacionada') as HTMLSelectElement;
        expect(escuela.options[0].value).toBe('');
        expect(escuela.options[1].text).toBe('Escuela Primaria Test');
    });

    it('disables assigned_to when user is NOT admin/secretario', () => {
        render(<TaskModal {...defaultProps} currentUserRole="MAESTRO_APOYO" />);
        expect(screen.getByLabelText('Asignar a')).toBeDisabled();
    });

    it('enables assigned_to when user is admin', () => {
        render(<TaskModal {...defaultProps} currentUserRole="ADMIN" />);
        expect(screen.getByLabelText('Asignar a')).not.toBeDisabled();
    });

    it('enables assigned_to when user is secretario', () => {
        render(<TaskModal {...defaultProps} currentUserRole="SECRETARIO" />);
        expect(screen.getByLabelText('Asignar a')).not.toBeDisabled();
    });

    it('renders color picker', () => {
        render(<TaskModal {...defaultProps} />);
        const colorInput = screen.getByLabelText('Color del Evento:');
        expect(colorInput).toHaveAttribute('type', 'color');
        // Note: color inputs normalize hex to lowercase
        expect(colorInput).toHaveValue('#3b82f6');
    });

    it('calls onClose when clicking Cancelar', () => {
        const onClose = vi.fn();
        render(<TaskModal {...defaultProps} onClose={onClose} />);
        fireEvent.click(screen.getByText('Cancelar'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onSave with form data on submit', async () => {
        const onSave = vi.fn();
        render(<TaskModal {...defaultProps} onSave={onSave} />);

        // Fill required fields — wrap in act to flush react-hook-form state updates
        await act(async () => {
            fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Mi nueva tarea' } });
            fireEvent.change(screen.getByLabelText('Fecha y Hora Inicio'), { target: { value: '2026-06-15T09:00' } });
            fireEvent.change(screen.getByLabelText('Fecha y Hora Fin'), { target: { value: '2026-06-15T10:00' } });
        });

        // Submit form via clicking the submit button
        await act(async () => {
            fireEvent.click(screen.getByText('Crear Tarea'));
        });

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledOnce();
        });
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Mi nueva tarea',
                start_time: '2026-06-15T09:00',
                end_time: '2026-06-15T10:00',
                event_type: 'TAREA',
                priority: 'MEDIA',
                status: 'PENDIENTE',
                color: '#3B82F6',
            })
        );
    });

    it('disables submit button when saving', () => {
        render(<TaskModal {...defaultProps} saving={true} />);
        const submitBtn = screen.getByText('Crear Tarea');
        expect(submitBtn).toBeDisabled();
    });

    it('shows "Actualizar" button text when editing', () => {
        render(
            <TaskModal
                {...defaultProps}
                initialData={{
                    id: 1,
                    title: 'Test',
                    event_type: 'TAREA',
                    priority: 'MEDIA',
                    status: 'PENDIENTE',
                    start_time: '2026-06-15T09:00',
                    end_time: '2026-06-15T10:00',
                    assigned_to: 1,
                    created_by: 1,
                    description: '',
                    color: '#3B82F6',
                }}
            />
        );
        expect(screen.getByText('Actualizar')).toBeInTheDocument();
        expect(screen.queryByText('Crear Tarea')).not.toBeInTheDocument();
    });
});
