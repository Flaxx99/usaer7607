import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Save } from 'lucide-react';
import type { CalendarEvent } from '../../api/calendar';

interface TaskModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (data: Partial<CalendarEvent>) => void;
    initialData?: CalendarEvent | null;
    users: any[];
    alunos: any[];
    escuelas: any[];
    currentUserRole: string;
}

const TaskModal = ({ opened, onClose, onSave, initialData, users, alunos, escuelas, currentUserRole }: TaskModalProps) => {
    const { register, handleSubmit, reset } = useForm<Partial<CalendarEvent>>({
        defaultValues: initialData || {
            event_type: 'TAREA',
            status: 'PENDIENTE',
            priority: 'MEDIA',
            color: '#3B82F6',
        }
    });

    useEffect(() => {
        if (initialData) reset(initialData);
    }, [initialData, reset]);

    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SECRETARIO';

    if (!opened) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl p-0 overflow-hidden">
                <div className="bg-primary p-6 text-primary-content flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <Calendar size={24} className="text-yellow-300" />
                        {initialData ? 'Editar Tarea/Evento' : 'Crear Nueva Tarea/Evento'}
                    </h3>
                    <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control md:col-span-2">
                            <label className="label"><span className="label-text font-bold">Título</span></label>
                            <input {...register('title', { required: true })} className="input input-bordered w-full" placeholder="Ej. Revisión de expediente..." />
                        </div>
                        
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Tipo</span></label>
                            <select {...register('event_type')} className="select select-bordered w-full">
                                <option value="EVALUACION">Evaluación Psicopedagógica</option>
                                <option value="REUNION">Reunión con Padres</option>
                                <option value="VISITA">Visita a Escuela</option>
                                <option value="TAREA">Tarea Administrativa</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Prioridad</span></label>
                            <select {...register('priority')} className="select select-bordered w-full">
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Fecha y Hora Inicio</span></label>
                            <input type="datetime-local" {...register('start_time')} className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Fecha y Hora Fin</span></label>
                            <input type="datetime-local" {...register('end_time')} className="input input-bordered w-full" required />
                        </div>
                    </div>

                    <div className="divider">Asignación y Vínculos</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Asignar a</span></label>
                            <select {...register('assigned_to')} className="select select-bordered w-full" disabled={!isAdmin}>
                                <option value="">Seleccionar responsable</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Estado</span></label>
                            <select {...register('status')} className="select select-bordered w-full">
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="COMPLETADO">Completado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Alumno Relacionado</span></label>
                            <select {...register('alumno')} className="select select-bordered w-full">
                                <option value="">Ninguno</option>
                                {alunos?.map(a => <option key={a.id} value={a.id}>{a.nombres} {a.apellido_paterno}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Escuela Relacionada</span></label>
                            <select {...register('escuela')} className="select select-bordered w-full">
                                <option value="">Ninguna</option>
                                {escuelas?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 p-4 bg-base-200 rounded-xl border border-base-300">
                        <label className="label-text font-bold">Color del Evento:</label>
                        <input type="color" {...register('color')} className="w-12 h-12 rounded cursor-pointer" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary px-8 gap-2">
                            <Save size={18} />
                            {initialData ? 'Actualizar' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default TaskModal;
