import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  FileText, Plus, CheckCircle, XCircle, Clock, 
  Calendar as CalendarIcon, Search, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';
import { getPermisos, getMetricasPermisos, createPermiso, responderPermiso, deletePermiso } from '../../api/permisos';
import type { Permiso, EstadoPermiso } from '../../interfaces/permisos';

const STATE_COLORS: Record<string, string> = {
  PENDIENTE: 'badge-warning',
  APROBADO: 'badge-success',
  RECHAZADO: 'badge-error',
};

const TIPOS_PERMISO = [
  { value: 'PERSONAL', label: 'Asuntos Personales' },
  { value: 'ENFERMEDAD', label: 'Enfermedad / Licencia Médica' },
  { value: 'COMISION', label: 'Comisión Oficial' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde (Parcial)' },
  { value: 'SALIDA_TEMPRANA', label: 'Salida Temprana (Parcial)' },
];

const GestionPermisos = () => {
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [permisoSeleccionado, setPermisoSeleccionado] = useState<Permiso | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [isAdminOrDirector, setIsAdminOrDirector] = useState(false);

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<Permiso>>();
    const { register: registerRes, handleSubmit: handleSubmitRes, reset: resetRes, formState: { errors: errorsRes } } = useForm<{motivo_respuesta: string}>();

    const tipoSeleccionado = watch('tipo');
    const esPermisoPorHoras = tipoSeleccionado === 'LLEGADA_TARDE' || tipoSeleccionado === 'SALIDA_TEMPRANA';

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (['ADMIN', 'DIRECTOR', 'ADMINISTRADOR'].includes(user.role)) {
                setIsAdminOrDirector(true);
            }
        }
    }, []);

    const { data: permisos, isLoading } = useQuery({
        queryKey: ['permisos'],
        queryFn: () => getPermisos({}),
    });

    const { data: metricas } = useQuery({
        queryKey: ['permisos-metricas'],
        queryFn: getMetricasPermisos,
        enabled: isAdminOrDirector
    });

    const permisosFiltrados = useMemo(() => {
      if (!permisos) return [];
      return permisos.filter((p) => {
        const cumpleBusqueda = 
            (p.profesor_nombre || '').toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            (p.motivo || '').toLowerCase().includes(busquedaDebounced.toLowerCase());

        const cumpleEstado = filtroEstado === 'TODOS' || (p.estado || '').toUpperCase() === filtroEstado.toUpperCase();
        
        return cumpleBusqueda && cumpleEstado;
      });
    }, [permisos, filtroEstado, busquedaDebounced]);

    const createMutation = useMutation({
        mutationFn: createPermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsCreateModalOpen(false);
            reset();
            toast.success('Solicitud Enviada 📬', { description: 'Tu permiso ha sido registrado y enviado a la dirección.' });
        },
        onError: (err: any) => toast.error('Error ❌', { description: err.response?.data?.detail || 'Revisa las fechas.' })
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, estado, respuesta }: { id: number, estado: EstadoPermiso, respuesta: string }) => 
            responderPermiso(id, estado, respuesta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsResponseModalOpen(false);
            resetRes();
            toast.success('¡Procesado! 👍', { description: 'La resolución de la solicitud fue guardada.' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            toast.success('Cancelada 🗑️', { description: 'Tu solicitud de permiso ha sido eliminada.' });
        },
        onError: () => toast.error('Error ❌', { description: 'No se pudo eliminar.' })
    });

    const handleCreate = (data: Partial<Permiso>) => {
        createMutation.mutate(data);
    };

    const handleResponder = (data: { motivo_respuesta: string }, estado: EstadoPermiso) => {
        if (permisoSeleccionado) {
            respondMutation.mutate({ 
                id: permisoSeleccionado.id, 
                estado, 
                respuesta: data.motivo_respuesta 
            });
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
            deleteMutation.mutate(id);
        }
    };

    const abrirModalRespuesta = (permiso: Permiso) => {
        setPermisoSeleccionado(permiso);
        resetRes();
        setIsResponseModalOpen(true);
    };

    const formatDate = (dateStr: string) => {
        try { return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es }); } catch { return dateStr; }
    };

    const getEstadoLabel = (estado: string) => {
        const est = (estado || 'PENDIENTE').toUpperCase();
        if (est === 'PENDIENTE') return 'En Espera';
        if (est === 'APROBADO') return 'Autorizado';
        return 'No Autorizado';
    };

    if (isLoading) {
        return (
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <TableSkeleton rows={10} />
          </div>
        );
    }
    
    return (
        <>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Trámites de Permisos del Personal</h1>
                            <p className="text-sm opacity-90 font-medium">
                                {isAdminOrDirector 
                                    ? 'Panel de control para la revisión, autorización y rechazo de licencias del personal.' 
                                    : 'Solicita licencias por asuntos personales, enfermedad o comisiones.'}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform" onClick={() => { reset(); setIsCreateModalOpen(true); }}>
                        <Plus size={22} />
                        Solicitar Nuevo Permiso
                    </button>
                </div>
            </div>

            {isAdminOrDirector && metricas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="En Espera" value={metricas.pendientes || 0} color="warning" icon={<Clock size={24}/>} />
                    <StatBox label="Autorizados" value={metricas.aprobados || 0} color="success" icon={<CheckCircle size={24}/>} />
                    <StatBox label="No Autorizados" value={metricas.rechazados || 0} color="error" icon={<XCircle size={24}/>} />
                    <StatBox label="Total Trámites" value={metricas.total || 0} color="primary" icon={<FileText size={24}/>} />
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300 p-6">
                <div className="flex items-center gap-2 mb-4 text-primary font-bold uppercase text-xs tracking-widest">
                    <Search size={14} />
                    <span>Filtros de Búsqueda Rápida</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Buscar Solicitud</span></label>
                        <div className="input input-bordered flex items-center gap-2">
                            <Search size={18} className="opacity-50" />
                            <input type="text" placeholder="Nombre del docente o motivo..." className="grow" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Estado de la Solicitud</span></label>
                        <div className="tabs tabs-boxed justify-start gap-2">
                            {['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'].map((est) => (
                                <button
                                    key={est}
                                    className={`tab transition-all ${filtroEstado === est ? 'tab-active !bg-primary !text-primary-content' : 'tab-inactive'}`}
                                    onClick={() => setFiltroEstado(est)}
                                >
                                    {est === 'TODOS' ? '📂 Todos' : est === 'PENDIENTE' ? '⏳ Espera' : est === 'APROBADO' ? '✅ Aprob.' : '❌ Rechaz.'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {permisosFiltrados && permisosFiltrados.map((p) => {
                    const safeColor = STATE_COLORS[(p.estado || 'PENDIENTE').toUpperCase()] || 'badge-ghost';
                    return (
                      <div key={p.id} className="card bg-base-100 shadow-sm border border-base-300 transition-all hover:shadow-md" style={{ borderLeft: `6px solid var(--color-${safeColor.split('-')[1]})` }}>
                        <div className="card-body p-6">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <div className="md:col-span-2 flex flex-col items-center justify-center border-r border-base-200 pr-4 gap-3">
                               <div className={`badge ${safeColor} badge-lg font-bold py-3 px-4`}>
                                 {getEstadoLabel(p.estado)}
                               </div>
                               <div className="text-center">
                                 <div className="p-2 bg-base-200 rounded-lg inline-block text-base-content/60 mb-1">
                                   <CalendarIcon size={16} />
                                 </div>
                                  <p className="text-xs font-bold uppercase opacity-50">Inicia el</p>
                                 <p className="text-sm font-black">{formatDate(p.fecha_inicio)}</p>
                               </div>
                            </div>
                            <div className="md:col-span-7 space-y-3">
                               <div className="flex items-start justify-between">
                                 <div>
                                   <h4 className="text-lg font-bold text-base-content">{p.tipo.replace('_', ' ')}</h4>
                                   <div className="flex items-center gap-2 mt-1">
                                     <div className="avatar placeholder">
                                       <div className="bg-primary text-primary-content rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                                         {p.profesor_nombre.charAt(0)}
                                       </div>
                                     </div>
                                     <span className="text-sm font-bold">{p.profesor_nombre}</span>
                                     <span className="text-xs opacity-50">•</span>
                                     <span className="text-xs opacity-70 font-medium">{p.escuela_nombre}</span>
                                   </div>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="badge badge-outline badge-sm font-bold">⏱️ {p.duracion_dias} {p.duracion_dias === 1 ? 'Día' : 'Días'}</span>
                                   {p.horas_solicitadas && <span className="badge badge-info badge-sm font-bold">⏱️ {p.horas_solicitadas} hrs</span>}
                                 </div>
                               </div>
                               <div className="bg-base-200 p-3 rounded-box border border-base-300">
                                  <p className="text-xs font-bold text-base-content/50 uppercase mb-1">Motivo de la solicitud:</p>
                                 <p className="text-sm leading-relaxed">{p.motivo}</p>
                               </div>
                               {p.respuesta_admin && (
                                 <div className={`p-3 rounded-box border ${safeColor === 'badge-success' ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                                   <p className="text-xs font-bold uppercase mb-1" style={{ color: `var(--color-${safeColor.split('-')[1]})` }}>
                                     Respuesta de Dirección ({p.administrador_nombre}):
                                   </p>
                                   <p className="text-sm font-medium italic">"{p.respuesta_admin}"</p>
                                 </div>
                               )}
                               <p className="text-xs text-right opacity-40 italic">Solicitado el {formatDate(p.fecha_solicitud)}</p>
                            </div>
                            <div className="md:col-span-3 flex justify-center items-center">
                               {isAdminOrDirector && (p.estado || '').toUpperCase() === 'PENDIENTE' && (
                                 <button className="btn btn-neutral btn-sm w-full md:w-auto gap-2" onClick={() => abrirModalRespuesta(p)}><Settings size={16} /> Gestionar</button>
                               )}
                               {!isAdminOrDirector && (p.estado || '').toUpperCase() === 'PENDIENTE' && (
                                 <button className="btn btn-error btn-outline btn-sm w-full md:w-auto gap-2" onClick={() => handleDelete(p.id)}><XCircle size={16} /> Cancelar</button>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
                {permisosFiltrados.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-base-200 rounded-box border-2 border-dashed border-base-300">
                    <Search size={48} className="text-base-content/20 mb-4" />
                    <p className="font-medium text-base-content/50">No se encontraron trámites con este estatus.</p>
                  </div>
                )}
              </div>
            </div>

            {isCreateModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md p-0 overflow-hidden">
                        <div className="bg-primary p-6 text-primary-content flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Plus size={24} /> Solicitar Licencia / Permiso</h3>
                            <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={() => setIsCreateModalOpen(false)}>✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Tipo de Permiso requerido</span></label>
                                    <select className="select select-bordered w-full" {...register('tipo', { required: "Obligatorio" })}>
                                        <option value="">Seleccione el motivo...</option>
                                        {TIPOS_PERMISO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    {errors.tipo && <span className="text-error text-xs mt-1">{errors.tipo.message as string}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-bold">Fecha de Inicio</span></label>
                                        <input type="date" className="input input-bordered w-full" {...register('fecha_inicio', { required: "Requerida" })} />
                                        {errors.fecha_inicio && <span className="text-error text-xs mt-1">{errors.fecha_inicio.message as string}</span>}
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-bold">Fecha de Término</span></label>
                                        <input type="date" className="input input-bordered w-full" {...register('fecha_fin', { required: "Requerida" })} />
                                        {errors.fecha_fin && <span className="text-error text-xs mt-1">{errors.fecha_fin.message as string}</span>}
                                    </div>
                                </div>
                                {esPermisoPorHoras && (
                                    <div className="bg-primary/10 p-4 rounded-box border border-primary/20">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">Horas requeridas</span></label>
                                            <input type="number" step="0.5" className="input input-bordered w-full" {...register('horas_solicitadas', { required: "Requerido", min: 0.5, max: 8 })} />
                                            {errors.horas_solicitadas && <span className="text-error text-xs mt-1">Indica horas entre 0.5 y 8</span>}
                                        </div>
                                    </div>
                                )}
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Motivo detallada</span></label>
                                    <textarea className="textarea textarea-bordered h-24" placeholder="Explica detalladamente el motivo..." {...register('motivo', { required: "Obligatorio", minLength: { value: 5, message: "Mínimo 5 caracteres" } })}></textarea>
                                    {errors.motivo && <span className="text-error text-xs mt-1">{errors.motivo.message as string}</span>}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                                    <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary gap-2"><Plus size={18} /> Enviar Solicitud</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}></div>
                </div>
            )}

            {isResponseModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md p-0 overflow-hidden">
                        <div className="bg-neutral text-neutral-content p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={24} /> Resolución de Dirección</h3>
                            <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={() => setIsResponseModalOpen(false)}>✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-base-200 p-4 rounded-box border border-base-300">
                                <p className="text-xs font-bold uppercase opacity-50 mb-1">Solicitante:</p>
                                <p className="text-sm font-bold">{permisoSeleccionado?.profesor_nombre}</p>
                                <p className="text-xs font-bold uppercase opacity-50 mt-3 mb-1">Motivo expuesto:</p>
                                <p className="text-sm italic opacity-80">"{permisoSeleccionado?.motivo}"</p>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Justificación Oficial</span></label>
                                <textarea className="textarea textarea-bordered h-32" {...registerRes('motivo_respuesta', { required: "Obligatorio" })}></textarea>
                                {errorsRes.motivo_respuesta && <span className="text-error text-xs mt-1">{errorsRes.motivo_respuesta.message as string}</span>}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-base-300">
                                <button className="btn btn-error btn-outline flex-1 gap-2" onClick={handleSubmitRes((d) => handleResponder(d, 'RECHAZADO'))}><XCircle size={18} /> Rechazar</button>
                                <button className="btn btn-success flex-1 gap-2" onClick={handleSubmitRes((d) => handleResponder(d, 'APROBADO'))}><CheckCircle size={18} /> Autorizar</button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsResponseModalOpen(false)}></div>
                </div>
            )}
        </>
    );
};

const StatBox = ({ label, value, color, icon }: any) => {
  const colorClasses: Record<string, string> = {
    warning: 'bg-warning/10 text-warning border-warning/20',
    success: 'bg-success/10 text-success border-success/20',
    error: 'bg-error/10 text-error border-error/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
  };
  return (
    <div className={`card bg-base-100 shadow-sm border-l-4 ${colorClasses[color] || 'border-base-300'} transition-all hover:shadow-md group`}>
      <div className="card-body p-5">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-base-200'} transition-colors group-hover:brightness-110`}>
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">{label}</p>
          <h4 className="text-3xl font-black mt-1">{value}</h4>
        </div>
      </div>
    </div>
  );
};

export default GestionPermisos;
