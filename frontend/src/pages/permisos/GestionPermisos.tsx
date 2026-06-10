import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPermisoSchema, type CreatePermisoFormData, TIPOS_PERMISO, STATE_COLORS } from '../../schemas/permiso';
import { 
  FileText, Plus, CheckCircle, XCircle, Clock, 
  Search, Settings, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton, ErrorState } from '../../components/Skeletons';
import { DataTable } from '../../components/DataTable';
import Modal from '../../components/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { getPermisos, getMetricasPermisos, createPermiso, responderPermiso, deletePermiso } from '../../api/permisos';
import type { Permiso, EstadoPermiso, TipoPermiso } from '../../interfaces/permisos';

const GestionPermisos = () => {
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [permisoSeleccionado, setPermisoSeleccionado] = useState<Permiso | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [isAdminOrDirector, setIsAdminOrDirector] = useState(false);

    const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm<CreatePermisoFormData>({
        resolver: zodResolver(createPermisoSchema),
        defaultValues: {
            tipo: '',
            fecha_inicio: '',
            fecha_fin: '',
            horas_solicitadas: null,
            motivo: '',
        }
    });
    const { register: registerRes, handleSubmit: handleSubmitRes, reset: resetRes, formState: { errors: errorsRes } } = useForm<{motivo_respuesta: string}>();

    const tipoSeleccionado = watch('tipo');
    const esPermisoPorHoras = tipoSeleccionado === 'LLEGADA_TARDE' || tipoSeleccionado === 'SALIDA_TEMPRANA';

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (['ADMIN', 'DIRECTOR', 'ADMINISTRADOR'].includes(user.role)) {
                    setIsAdminOrDirector(true);
                }
            } catch { /* ignore */ }
        }
    }, []);

    const { data: permisos, isLoading, isError, error } = useQuery({
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
            toast.success('¡Solicitado! ✅', { description: 'Tu permiso ha sido registrado y enviado a la dirección.' });
        },
        onError: (err) => {
            const errorData = isAxiosError(err) ? err.response?.data as Record<string, unknown> | undefined : undefined;
            toast.error('Error ❌', { description: (errorData?.detail as string) || 'Revisa las fechas.' });
        }
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, estado, respuesta }: { id: number, estado: EstadoPermiso, respuesta: string }) => 
            responderPermiso(id, estado, respuesta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsResponseModalOpen(false);
            resetRes();
            toast.success('¡Procesado! ✅', { description: 'La resolución de la solicitud fue guardada.' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            toast.success('¡Cancelada! 🗑️', { description: 'Tu solicitud de permiso ha sido eliminada.' });
        },
        onError: () => toast.error('Error ❌', { description: 'No se pudo eliminar.' })
    });

    const handleCreate: SubmitHandler<CreatePermisoFormData> = (data) => {
        const { horas_solicitadas, ...rest } = data;
        const payload = { ...rest, tipo: rest.tipo as TipoPermiso };
        const finalPayload = horas_solicitadas ? { ...payload, horas_solicitadas } : payload;
        createMutation.mutate(finalPayload as Partial<Permiso>);
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

    const handleDelete = useCallback((id: number) => {
        if (window.confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
            deleteMutation.mutate(id);
        }
    }, [deleteMutation]);

    const abrirDetalle = (permiso: Permiso) => {
        setPermisoSeleccionado(permiso);
        setIsDetailModalOpen(true);
    };

    const abrirModalRespuesta = (permiso: Permiso) => {
        setPermisoSeleccionado(permiso);
        resetRes();
        setIsResponseModalOpen(true);
    };

    const formatDate = useCallback((dateStr: string) => {
        try { return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es }); } catch { return dateStr; }
    }, []);

    const getEstadoLabel = useCallback((estado: string) => {
        const est = (estado || 'PENDIENTE').toUpperCase();
        if (est === 'PENDIENTE') return 'En Espera';
        if (est === 'APROBADO') return 'Autorizado';
        return 'No Autorizado';
    }, []);

    const columns: ColumnDef<Permiso>[] = [
        {
            id: 'profesor',
            header: 'Solicitante',
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-8 h-8 text-xs font-bold">
                                {p.profesor_nombre?.charAt(0) || '?'}
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-sm">{p.profesor_nombre}</p>
                            <p className="text-xs opacity-50">{p.escuela_nombre}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'tipo',
            header: 'Tipo',
            cell: ({ row }) => <span className="font-medium text-sm">{row.original.tipo?.replace('_', ' ')}</span>
        },
        {
            id: 'estado',
            header: 'Estado',
            cell: ({ row }) => {
                const est = (row.original.estado || 'PENDIENTE').toUpperCase();
                return (
                    <span className={`badge badge-sm font-bold ${STATE_COLORS[est] || 'badge-ghost'}`}>
                        {getEstadoLabel(est)}
                    </span>
                );
            }
        },
        {
            id: 'fechas',
            header: 'Fechas',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium">{formatDate(row.original.fecha_inicio)}</span>
                    <span className="opacity-50">→ {formatDate(row.original.fecha_fin)}</span>
                </div>
            )
        },
        {
            id: 'duracion',
            header: 'Duración',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <span className="badge badge-ghost badge-sm font-bold">{row.original.duracion_dias}d</span>
                    {row.original.horas_solicitadas && (
                        <span className="badge badge-info badge-sm font-bold">{row.original.horas_solicitadas}h</span>
                    )}
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const p = row.original;
                const esPendiente = (p.estado || '').toUpperCase() === 'PENDIENTE';
                return (
                    <div className="flex justify-end gap-1">
                        <button 
                            className="btn btn-ghost btn-xs text-primary" 
                            onClick={() => abrirDetalle(p)}
                            title="Ver Detalle"
                        >
                            <Eye size={14} />
                        </button>
                        {isAdminOrDirector && esPendiente && (
                            <button 
                                className="btn btn-ghost btn-xs text-neutral" 
                                onClick={() => abrirModalRespuesta(p)}
                                title="Gestionar"
                            >
                                <Settings size={14} />
                            </button>
                        )}
                        {!isAdminOrDirector && esPendiente && (
                            <button 
                                className="btn btn-ghost btn-xs text-error" 
                                onClick={() => handleDelete(p.id)}
                                title="Cancelar"
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    if (isError) return <ErrorState error={error} message="Error al cargar los permisos. Intenta de nuevo." />;

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
            {/* CABECERA HERO */}
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

            {/* MÉTRICAS (solo admin) */}
            {isAdminOrDirector && metricas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card bg-base-100 shadow-sm border-l-4 border-warning transition-all hover:shadow-md">
                        <div className="card-body p-5">
                            <div className="p-3 rounded-xl bg-warning/10 text-warning w-fit"><Clock size={24} /></div>
                            <div className="mt-4">
                                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">En Espera</p>
                                <h4 className="text-3xl font-black mt-1">{metricas.pendientes || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border-l-4 border-success transition-all hover:shadow-md">
                        <div className="card-body p-5">
                            <div className="p-3 rounded-xl bg-success/10 text-success w-fit"><CheckCircle size={24} /></div>
                            <div className="mt-4">
                                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Autorizados</p>
                                <h4 className="text-3xl font-black mt-1">{metricas.aprobados || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border-l-4 border-error transition-all hover:shadow-md">
                        <div className="card-body p-5">
                            <div className="p-3 rounded-xl bg-error/10 text-error w-fit"><XCircle size={24} /></div>
                            <div className="mt-4">
                                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">No Autorizados</p>
                                <h4 className="text-3xl font-black mt-1">{metricas.rechazados || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border-l-4 border-primary transition-all hover:shadow-md">
                        <div className="card-body p-5">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit"><FileText size={24} /></div>
                            <div className="mt-4">
                                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Total Trámites</p>
                                <h4 className="text-3xl font-black mt-1">{metricas.total || 0}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FILTROS */}
            <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-6">
                <div className="flex items-center gap-2 text-base-content/60">
                    <Search size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Filtros Avanzados</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                        <label className="label" htmlFor="buscar_solicitud"><span className="label-text font-bold">Buscar Solicitud</span></label>
                        <div className="input input-bordered flex items-center gap-2">
                            <Search size={18} className="opacity-50" />
                            <input id="buscar_solicitud" type="text" placeholder="Nombre del docente o motivo..." className="grow" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Estado de la Solicitud</span></label>
                        <div className="tabs tabs-boxed justify-start gap-2">
                            {['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'].map((est) => (
                                <button
                                    key={est}
                                    className={`tab transition-all ${filtroEstado === est ? 'tab-active !bg-primary !text-primary-content' : ''}`}
                                    onClick={() => setFiltroEstado(est)}
                                >
                                    {est === 'TODOS' ? 'Todos' : est === 'PENDIENTE' ? 'Espera' : est === 'APROBADO' ? 'Aprob.' : 'Rechaz.'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DATATABLE */}
            <DataTable 
                data={permisosFiltrados} 
                columns={columns} 
                isLoading={false}
                totalCount={permisosFiltrados.length}
                page={1}
                onPageChange={() => {}}
                onSearchChange={setBusqueda}
                searchValue={busqueda}
                placeholder="Buscar por nombre o motivo..."
            />
            </div>

            <Modal
                isOpen={isDetailModalOpen && !!permisoSeleccionado}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detalle del Permiso"
                icon={<Eye size={24} />}
            >
                {permisoSeleccionado && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-10 h-10 text-sm font-bold">
                                    {permisoSeleccionado.profesor_nombre?.charAt(0)}
                                </div>
                            </div>
                            <div>
                                <p className="font-bold text-lg">{permisoSeleccionado.profesor_nombre}</p>
                                <p className="text-sm opacity-60">{permisoSeleccionado.escuela_nombre}</p>
                            </div>
                            <div className="ml-auto">
                                <span className={`badge badge-sm font-bold ${STATE_COLORS[(permisoSeleccionado.estado || 'PENDIENTE').toUpperCase()]}`}>
                                    {getEstadoLabel(permisoSeleccionado.estado)}
                                </span>
                            </div>
                        </div>
                        <div className="divider my-0"></div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-base-200 p-3 rounded-xl">
                                <p className="text-xs font-bold uppercase opacity-50">Tipo</p>
                                <p className="font-bold">{permisoSeleccionado.tipo?.replace('_', ' ')}</p>
                            </div>
                            <div className="bg-base-200 p-3 rounded-xl">
                                <p className="text-xs font-bold uppercase opacity-50">Duración</p>
                                <p className="font-bold">{permisoSeleccionado.duracion_dias} día(s){permisoSeleccionado.horas_solicitadas ? ` / ${permisoSeleccionado.horas_solicitadas} hrs` : ''}</p>
                            </div>
                            <div className="bg-base-200 p-3 rounded-xl">
                                <p className="text-xs font-bold uppercase opacity-50">Inicio</p>
                                <p className="font-bold">{formatDate(permisoSeleccionado.fecha_inicio)}</p>
                            </div>
                            <div className="bg-base-200 p-3 rounded-xl">
                                <p className="text-xs font-bold uppercase opacity-50">Término</p>
                                <p className="font-bold">{formatDate(permisoSeleccionado.fecha_fin)}</p>
                            </div>
                        </div>
                        <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                            <p className="text-xs font-bold uppercase opacity-50 mb-1">Motivo de la solicitud:</p>
                            <p className="text-sm leading-relaxed">{permisoSeleccionado.motivo}</p>
                        </div>
                        {permisoSeleccionado.respuesta_admin && (
                            <div className={`p-4 rounded-xl border ${permisoSeleccionado.estado?.toUpperCase() === 'APROBADO' ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                                <p className="text-xs font-bold uppercase mb-1">{permisoSeleccionado.estado?.toUpperCase() === 'APROBADO' ? '✅ Respuesta de Dirección' : '❌ Respuesta de Dirección'}</p>
                                <p className="text-sm font-medium italic">"{permisoSeleccionado.respuesta_admin}"</p>
                                <p className="text-xs opacity-50 mt-1">— {permisoSeleccionado.administrador_nombre}</p>
                            </div>
                        )}
                        <p className="text-xs text-right opacity-40 italic">Solicitado el {formatDate(permisoSeleccionado.fecha_solicitud)}</p>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Solicitar Licencia / Permiso"
                icon={<Plus size={24} />}
            >
                <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                    <div className="form-control">
                        <label className="label" htmlFor="tipo"><span className="label-text font-bold">Tipo de Permiso</span></label>
                        <select id="tipo" className="select select-bordered w-full" {...register('tipo')}>
                            <option value="">Seleccione el motivo...</option>
                            {TIPOS_PERMISO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {errors.tipo && <span className="text-error text-xs mt-1">{errors.tipo.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                                <label className="label" htmlFor="fecha_inicio"><span className="label-text font-bold">Fecha de Inicio</span></label>
                            <input id="fecha_inicio" type="date" className="input input-bordered w-full" {...register('fecha_inicio')} />
                            {errors.fecha_inicio && <span className="text-error text-xs mt-1">{errors.fecha_inicio.message}</span>}
                        </div>
                        <div className="form-control">
                                <label className="label" htmlFor="fecha_fin"><span className="label-text font-bold">Fecha de Término</span></label>
                            <input id="fecha_fin" type="date" className="input input-bordered w-full" {...register('fecha_fin')} />
                            {errors.fecha_fin && <span className="text-error text-xs mt-1">{errors.fecha_fin.message}</span>}
                        </div>
                    </div>
                    {esPermisoPorHoras && (
                        <div className="bg-primary/10 p-4 rounded-box border border-primary/20">
                            <div className="form-control">
                                <label className="label" htmlFor="horas_solicitadas"><span className="label-text font-bold">Horas requeridas</span></label>
                                <Controller
                                    name="horas_solicitadas"
                                    control={control}
                                    render={({ field }) => (
                                        <input 
                                            id="horas_solicitadas"
                                            type="number" 
                                            step="0.5" 
                                            className="input input-bordered w-full" 
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                        />
                                    )}
                                />
                                {errors.horas_solicitadas && <span className="text-error text-xs mt-1">{errors.horas_solicitadas.message}</span>}
                            </div>
                        </div>
                    )}
                    <div className="form-control">
                        <label className="label" htmlFor="motivo"><span className="label-text font-bold">Motivo</span></label>
                        <textarea id="motivo" className="textarea textarea-bordered h-24" placeholder="Explica detalladamente el motivo..." {...register('motivo')}></textarea>
                        {errors.motivo && <span className="text-error text-xs mt-1">{errors.motivo.message}</span>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary gap-2" disabled={createMutation.isPending}>
                            {createMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <><Plus size={18} /> Enviar Solicitud</>}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isResponseModalOpen && !!permisoSeleccionado}
                onClose={() => setIsResponseModalOpen(false)}
                title="Resolución de Dirección"
                icon={<Settings size={24} />}
                color="neutral"
            >
                {permisoSeleccionado && (
                    <div className="space-y-6">
                        <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                            <p className="text-xs font-bold uppercase opacity-50 mb-1">Solicitante:</p>
                            <p className="text-sm font-bold">{permisoSeleccionado.profesor_nombre}</p>
                            <p className="text-xs font-bold uppercase opacity-50 mt-3 mb-1">Motivo expuesto:</p>
                            <p className="text-sm italic opacity-80">"{permisoSeleccionado.motivo}"</p>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="motivo_respuesta"><span className="label-text font-bold">Justificación Oficial</span></label>
                            <textarea id="motivo_respuesta" className="textarea textarea-bordered h-32" {...registerRes('motivo_respuesta', { required: "Obligatorio" })}></textarea>
                            {errorsRes.motivo_respuesta && <span className="text-error text-xs mt-1">{errorsRes.motivo_respuesta.message}</span>}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-base-300">
                            <button className="btn btn-error btn-outline flex-1 gap-2" onClick={handleSubmitRes((d) => handleResponder(d, 'RECHAZADO'))} disabled={respondMutation.isPending}>
                                <XCircle size={18} /> Rechazar
                            </button>
                            <button className="btn btn-success flex-1 gap-2" onClick={handleSubmitRes((d) => handleResponder(d, 'APROBADO'))} disabled={respondMutation.isPending}>
                                {respondMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <><CheckCircle size={18} /> Autorizar</>}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default GestionPermisos;
