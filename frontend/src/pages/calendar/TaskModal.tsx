import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskForm } from '../../schemas/calendar';
import { Calendar, Save } from 'lucide-react';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import type { CalendarEvent } from '../../api/calendar';

interface SelectOption {
    id: number;
    nombre: string;
    apellido_paterno?: string;
    numero_empleado?: string;
    nombres?: string;
    first_name?: string;
    last_name?: string;
}

interface TaskModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (data: Partial<CalendarEvent>) => void;
    initialData?: CalendarEvent | null;
    users: SelectOption[];
    alunos: SelectOption[];
    escuelas: SelectOption[];
    currentUserRole: string;
    saving?: boolean;
}

const TaskModal = ({ opened, onClose, onSave, initialData, users, alunos, escuelas, currentUserRole, saving = false }: TaskModalProps) => {
    const { register, handleSubmit, reset, setFocus } = useForm<TaskForm>({
        resolver: zodResolver(taskSchema),
        defaultValues: initialData ? {
            title: initialData.title || '',
            event_type: initialData.event_type || 'TAREA',
            priority: initialData.priority || 'MEDIA',
            status: initialData.status || 'PENDIENTE',
            start_time: initialData.start_time || '',
            end_time: initialData.end_time || '',
            assigned_to: initialData.assigned_to || undefined,
            alumno: initialData.alumno || undefined,
            escuela: initialData.escuela || undefined,
            color: initialData.color || '#3B82F6',
        } : {
            event_type: 'TAREA',
            status: 'PENDIENTE',
            priority: 'MEDIA',
            color: '#3B82F6',
        }
    });

    useEffect(() => {
        if (initialData) reset(initialData as unknown as TaskForm);
    }, [initialData, reset]);

    useEffect(() => {
        if (opened) {
            setFocus('title');
        }
    }, [opened, setFocus]);

    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SECRETARIO';

    if (!opened) return null;

    return (
        <Modal
            isOpen={opened}
            onClose={onClose}
            title={initialData ? 'Editar Tarea/Evento' : 'Crear Nueva Tarea/Evento'}
            icon={<Calendar size={24} />}
            size="lg"
        >
            <form onSubmit={handleSubmit((data) => {
                onSave(data as unknown as Partial<CalendarEvent>);
            })} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control md:col-span-2">
                            <label className="label" htmlFor="title"><span className="label-text font-bold">Título</span></label>
                            <input id="title" {...register('title')} className="input input-bordered w-full" placeholder="Ej. Revisión de expediente..." />
                        </div>
                        
                        <div className="form-control">
                            <label className="label" htmlFor="event_type"><span className="label-text font-bold">Tipo</span></label>
                            <select id="event_type" {...register('event_type')} className="select select-bordered w-full">
                                <option value="EVALUACION">Evaluación Psicopedagógica</option>
                                <option value="REUNION">Reunión con Padres</option>
                                <option value="VISITA">Visita a Escuela</option>
                                <option value="TAREA">Tarea Administrativa</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="priority"><span className="label-text font-bold">Prioridad</span></label>
                            <select id="priority" {...register('priority')} className="select select-bordered w-full">
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="start_time"><span className="label-text font-bold">Fecha y Hora Inicio</span></label>
                            <input id="start_time" type="datetime-local" {...register('start_time')} className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="end_time"><span className="label-text font-bold">Fecha y Hora Fin</span></label>
                            <input id="end_time" type="datetime-local" {...register('end_time')} className="input input-bordered w-full" required />
                        </div>
                    </div>

                    <div className="divider">Asignación y Vínculos</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label" htmlFor="assigned_to"><span className="label-text font-bold">Asignar a</span></label>
                            <select id="assigned_to" {...register('assigned_to')} className="select select-bordered w-full" disabled={!isAdmin}>
                                <option value="">Seleccionar responsable</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="status"><span className="label-text font-bold">Estado</span></label>
                            <select id="status" {...register('status')} className="select select-bordered w-full">
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="COMPLETADO">Completado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="alumno"><span className="label-text font-bold">Alumno Relacionado</span></label>
                            <select id="alumno" {...register('alumno')} className="select select-bordered w-full">
                                <option value="">Ninguno</option>
                                {alunos?.map(a => <option key={a.id} value={a.id}>{a.nombres} {a.apellido_paterno}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="escuela"><span className="label-text font-bold">Escuela Relacionada</span></label>
                            <select id="escuela" {...register('escuela')} className="select select-bordered w-full">
                                <option value="">Ninguna</option>
                                {escuelas?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 p-4 bg-base-200 rounded-xl border border-base-300">
                        <label className="label-text font-bold" htmlFor="color">Color del Evento:</label>
                        <input id="color" type="color" {...register('color')} className="w-12 h-12 rounded cursor-pointer" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <LoadingButton type="submit" className="btn btn-primary px-8 gap-2" icon={Save} loading={saving}>
                        {initialData ? 'Actualizar' : 'Crear Tarea'}
                    </LoadingButton>
                    </div>
                </form>
            </Modal>
    );
};

export default TaskModal;
