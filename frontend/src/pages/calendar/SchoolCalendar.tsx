import { useState, useMemo } from 'react';
import { 
  useQuery, useMutation, useQueryClient 
} from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, Plus, Clock, 
  AlertCircle, Trash2, Edit2, CheckCircle, XCircle, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useLoading } from '../../context/LoadingContext';
import { EmptyState, ErrorState } from '../../components/Skeletons';
import { SearchBar } from '../../components/SearchBar';
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
    const [searchQuery, setSearchQuery] = useState('');

    const { data: events, isLoading: loadingEvents, isError, error } = useQuery({
        queryKey: ['calendar_events'],
        queryFn: () => calendarApi.getEvents(),
    });

    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events?.results;
        const q = searchQuery.toLowerCase();
        return events?.results?.filter(e =>
            e.title.toLowerCase().includes(q) ||
            (e.description?.toLowerCase() || '').includes(q) ||
            (e.assigned_to_nombre?.toLowerCase() || '').includes(q)
        );
    }, [events, searchQuery]);

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
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Guardado!</span>, { description: 'El evento/tarea ha sido guardado correctamente.' });
        },
        onError: (err) => {
            const errorData = isAxiosError(err) ? err.response?.data as Record<string, unknown> | undefined : undefined;
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: (errorData?.detail as string) || 'No se pudo guardar el evento.' });
        },
        onSettled: () => hideLoading(),
    });

    const deleteMutation = useMutation({
        mutationFn: calendarApi.deleteEvent,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminado!</span>, { description: 'El evento ha sido borrado.' });
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

    if (isError) return <ErrorState error={error} message="Error al cargar la agenda. Intenta de nuevo." />;

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
                                <EmptyState icon={AlertCircle} title="No hay tareas urgentes." />
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 mb-2">
                            <p className="text-sm text-base-content/60">{filteredEvents?.length || 0} eventos</p>
                            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por evento, descripción o asignado..." />
                        </div>
                        <div className="overflow-x-auto">
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
                                    {filteredEvents?.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12"><EmptyState icon={Search} title="No se encontraron eventos con ese término." /></td></tr>
                                    ) : (filteredEvents?.map(e => (
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
                                                      <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
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
                users={(users?.results || []).map(u => ({ id: u.id, nombre: u.nombre, first_name: u.nombre, last_name: u.apellido_paterno || '' }))}
                alunos={(alunos?.results || []).map(a => ({ id: a.id, nombre: a.nombres, nombres: a.nombres, apellido_paterno: a.apellido_paterno }))}
                escuelas={escuelas || []}
                currentUserRole={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role : ''}
                saving={saveMutation.isPending}
            />
        </div>
    );
};

export default SchoolCalendar;
