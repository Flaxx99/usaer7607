import { useState } from 'react';
import { 
  useQuery, useMutation, useQueryClient 
} from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, Plus, Clock, 
  AlertCircle, Trash, Edit2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoading } from '../../context/LoadingContext';
import TaskModal from './TaskModal';
import { getUsuarios } from '../../api/usuarios';
import { getAlumnos } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas';
import { calendarApi } from '../../api/calendar';
import type { CalendarEvent } from '../../api/calendar';

const SchoolCalendar = () => {
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const { data: events, isLoading: loadingEvents } = useQuery({
        queryKey: ['calendar_events'],
        queryFn: () => calendarApi.getEvents(),
    });

    const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => getUsuarios() });
    const { data: alunos } = useQuery({ queryKey: ['alumnos'], queryFn: () => getAlumnos() });
    const { data: escuelas } = useQuery({ queryKey: ['escuelas'], queryFn: () => getEscuelas() });

    const saveMutation = useMutation({
        mutationFn: calendarApi.saveEvent,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            setModalOpened(false);
            setEditingEvent(null);
            toast.success('Calendario Actualizado', { description: 'El evento/tarea ha sido guardado correctamente.' });
        },
        onError: (err: any) => {
            toast.error('Error', { description: err.response?.data?.detail || 'No se pudo guardar el evento.' });
        },
        onSettled: () => hideLoading(),
    });

    const deleteMutation = useMutation({
        mutationFn: calendarApi.deleteEvent,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            toast.success('Eliminado', { description: 'El evento ha sido borrado.' });
        },
        onSettled: () => hideLoading(),
    });

    const handleOpenCreate = () => {
        setEditingEvent(null);
        setModalOpened(true);
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        setModalOpened(true);
    };

    const handleSave = (data: Partial<CalendarEvent>) => {
        saveMutation.mutate({
            ...data,
            id: editingEvent?.id,
        });
    };

    if (loadingEvents) return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg text-primary" />
          <p className="text-lg font-semibold text-primary animate-pulse">Cargando agenda...</p>
        </div>
      </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <CalendarIcon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Agenda y Tareas USAER
                            </h1>
                            <p className="text-sm opacity-90 font-medium">Gestión de actividades, evaluaciones y tareas administrativas.</p>
                        </div>
                    </div>
                    <button 
                        className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                        onClick={handleOpenCreate}
                    >
                        <Plus size={22} />
                        Nueva Tarea/Evento
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUMNA 1: URGENTES */}
                <div className="card bg-base-100 shadow-sm border border-base-300 border-t-4 border-t-error">
                    <div className="card-body p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="text-error" size={20} />
                            <h3 className="text-lg font-bold">Urgentes (Alta)</h3>
                        </div>
                        <div className="divider my-0"></div>
                        <div className="flex flex-col gap-3 mt-4">
                            {events?.results?.filter(e => e.priority === 'ALTA' && e.status === 'PENDIENTE').map(e => (
                                <div key={e.id} className="card bg-error/5 border border-error/20 p-3 transition-all hover:bg-error/10 group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold truncate">{e.title}</span>
                                        <button 
                                          className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100" 
                                          onClick={() => handleOpenEdit(e)}
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-base-content/50">{new Date(e.start_time).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {events?.results?.filter(e => e.priority === 'ALTA' && e.status === 'PENDIENTE').length === 0 && (
                                <p className="text-xs text-center text-base-content/40 italic">No hay tareas urgentes.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2 & 3: CRONOGRAMA */}
                <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300 border-t-4 border-t-primary">
                    <div className="card-body p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="text-primary" size={20} />
                            <h3 className="text-lg font-bold">Cronograma de Actividades</h3>
                        </div>
                        <div className="divider my-0"></div>
                        <div className="overflow-x-auto mt-4">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="text-xs uppercase opacity-60">
                                        <th>Fecha/Hora</th>
                                        <th>Evento/Tarea</th>
                                        <th>Asignado</th>
                                        <th>Relacionada</th>
                                        <th>Estado</th>
                                        <th className="text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events?.results?.map(e => (
                                        <tr key={e.id} className="hover">
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{new Date(e.start_time).toLocaleDateString()}</span>
                                                    <span className="text-xs opacity-50">{new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: e.color }} />
                                                    <span className="text-sm font-bold">{e.title}</span>
                                                </div>
                                                <p className="text-xs opacity-50 truncate max-w-xs">{e.description}</p>
                                            </td>
                                            <td>
                                                <span className="badge badge-ghost badge-sm font-medium">{e.assigned_to_nombre || 'S/N'}</span>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    {e.alumno_nombre && <span className="badge badge-outline badge-xs text-primary">Alum: {e.alumno_nombre}</span>}
                                                    {e.escuela_nombre && <span className="badge badge-outline badge-xs text-secondary">Esc: {e.escuela_nombre}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-sm font-bold ${
                                                    e.status === 'COMPLETADO' ? 'badge-success' : 
                                                    e.status === 'CANCELADO' ? 'badge-error' : 'badge-warning'
                                                }`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button 
                                                      className="btn btn-ghost btn-xs text-primary" 
                                                      onClick={() => handleOpenEdit(e)}
                                                    >
                                                      <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                      className="btn btn-ghost btn-xs text-error" 
                                                      onClick={() => {
                                                        if (confirm('¿Eliminar este evento?')) deleteMutation.mutate(e.id);
                                                      }}
                                                    >
                                                      <Trash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <TaskModal 
                opened={modalOpened} 
                onClose={() => { setModalOpened(false); setEditingEvent(null); }} 
                onSave={handleSave}
                initialData={editingEvent}
                users={(users as unknown as any[]) || []}
                alunos={(alunos as unknown as any[]) || []}
                escuelas={escuelas || []}
                currentUserRole={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role : ''}
            />
        </div>
    );
};

export default SchoolCalendar;
