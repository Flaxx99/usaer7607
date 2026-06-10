import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    AlertTriangle, CheckCircle, Plus, Search, 
    MessageSquare, FileText, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';
import { getIncidencias, createIncidencia, resolverIncidencia, getMaestrosParaSelect } from '../../api/incidencias';
import type { Incidencia, IncidenciaInput } from '../../interfaces/incidencia';

const GestionIncidencias = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [resolveItem, setResolveItem] = useState<Incidencia | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);

    const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate } } = useForm<IncidenciaInput>();
    const { register: registerResolve, handleSubmit: handleSubmitResolve, reset: resetResolve, formState: { errors: errorsResolve } } = useForm<{respuesta: string}>();

    const { data: incidencias, isLoading } = useQuery({
        queryKey: ['incidencias'],
        queryFn: getIncidencias,
    });

    const { data: maestros } = useQuery({
        queryKey: ['maestros-select'],
        queryFn: getMaestrosParaSelect,
        enabled: isCreateOpen,
    });

    const incidenciasFiltradas = incidencias?.filter(i => {
        const cumpleEstado = 
            filtroEstado === 'TODOS' || 
            (filtroEstado === 'PENDIENTE' && i.estado === 'PENDIENTE') ||
            (filtroEstado === 'RESUELTA' && i.estado === 'RESUELTA');
        
        const cumpleBusqueda = 
            i.titulo.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            i.profesor_nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            i.descripcion.toLowerCase().includes(busquedaDebounced.toLowerCase());

        return cumpleEstado && cumpleBusqueda;
    });

    const createMutation = useMutation({
        mutationFn: createIncidencia,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            setIsCreateOpen(false);
            resetCreate();
            toast.success('Incidencia Reportada', { description: 'El reporte ha sido guardado en la bitácora.' });
        },
        onError: (err: any) => toast.error('Error al reportar', { description: err.response?.data?.detail || 'Verifique los datos.' })
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, respuesta }: { id: number, estado: 'RESUELTA', respuesta: string }) =>
            resolverIncidencia(id, { respuesta_admin: respuesta }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            setResolveItem(null);
            resetResolve();
            toast.success('Caso Resuelto', { description: 'La resolución ha sido guardada y notificada.' });
        }
    });

    const onCreateSubmit = (data: IncidenciaInput) => {
        createMutation.mutate(data);
    };

    const onResolveSubmit = (data: { respuesta: string }) => {
        if (resolveItem) {
            respondMutation.mutate({ 
                id: resolveItem.id, 
                estado: 'RESUELTA', 
                respuesta: data.respuesta 
            });
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <TableSkeleton rows={10} />
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <div className="card bg-warning text-warning-content shadow-lg border-l-8 border-warning-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Bitácora de Incidencias</h1>
                            <p className="text-sm opacity-90 font-medium">Registro oficial de situaciones escolares, accidentes o faltas de conducta.</p>
                        </div>
                    </div>
                    <button className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform" onClick={() => setIsCreateOpen(true)}>
                        <Plus size={22} />
                        Reportar Incidencia
                    </button>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Estado del Reporte</span></label>
                        <div className="tabs tabs-boxed justify-start gap-2">
                            {['TODOS', 'PENDIENTE', 'RESUELTA'].map((est) => (
                                <button
                                    key={est}
                                    className={`tab transition-all ${filtroEstado === est ? 'tab-active !bg-warning !text-warning-content' : 'tab-inactive'}`}
                                    onClick={() => setFiltroEstado(est)}
                                >
                                    {est === 'TODOS' ? '📂 Todos' : est === 'PENDIENTE' ? '⏳ Pendientes' : '✅ Resueltas'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Buscar en la Bitácora</span></label>
                        <div className="input input-bordered flex items-center gap-2">
                            <Search size={18} className="opacity-50" />
                            <input type="text" placeholder="Buscar por título, persona o descripción..." className="grow" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {incidenciasFiltradas?.map((inc) => (
                    <div key={inc.id} className="card bg-base-100 shadow-sm border border-base-300 transition-all hover:shadow-md" style={{ borderLeft: `6px solid ${inc.estado === 'PENDIENTE' ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
                        <div className="card-body p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`badge ${inc.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-success'} badge-lg font-bold py-3 px-4`}>
                                        {inc.estado === 'PENDIENTE' ? 'Pendiente de Atención' : 'Caso Resuelto'}
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-50 font-bold uppercase">Reportado el {new Date(inc.fecha_reporte).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <h3 className="text-xl font-bold text-base-content">{inc.titulo}</h3>
                                    </div>
                                </div>
                                {inc.estado === 'PENDIENTE' && (
                                    <button className="btn btn-primary btn-sm gap-2" onClick={() => setResolveItem(inc)}><MessageSquare size={16} /> Resolver</button>
                                )}
                            </div>
                            <div className="bg-base-200 p-4 rounded-box border border-base-300 my-4">
                                <p className="text-xs font-bold text-base-content/50 uppercase mb-1">Descripción del incidente:</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{inc.descripcion}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="avatar placeholder">
                                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 text-xs">{inc.profesor_nombre.charAt(0)}</div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-50 uppercase">Involucrado:</p>
                                        <p className="text-sm font-bold">{inc.profesor_nombre}</p>
                                    </div>
                                </div>
                                {inc.estado === 'RESUELTA' && inc.respuesta_admin && (
                                    <div className="bg-success/10 border border-success/20 p-3 rounded-box max-w-md">
                                        <p className="text-xs font-bold text-success uppercase mb-1">Resolución Oficial:</p>
                                        <p className="text-sm italic text-success-content">{inc.respuesta_admin}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {incidenciasFiltradas?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-base-200 rounded-box border-2 border-dashed border-base-300">
                        <Search size={48} className="text-base-content/20 mb-4" />
                        <p className="font-medium text-base-content/50">No se encontraron reportes con estos filtros.</p>
                    </div>
                )}
            </div>

            {/* MODAL CREAR */}
            {isCreateOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg p-0 overflow-hidden">
                        <div className="bg-warning text-warning-content p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2"><AlertTriangle size={24} /> Nuevo Reporte de Incidencia</h3>
                            <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={() => setIsCreateOpen(false)}>✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Título del Incidente</span></label>
                                    <input type="text" className="input input-bordered w-full" {...registerCreate('titulo', { required: "El título es obligatorio" })} />
                                    {errorsCreate.titulo && <span className="text-error text-xs mt-1">{errorsCreate.titulo.message as string}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Profesor / Personal Involucrado</span></label>
                                    <select className="select select-bordered w-full" {...registerCreate('profesor', { required: "Debe seleccionar al involucrado" })}>
                                        <option value="">Seleccione el personal...</option>
                                        {maestros?.map((m: any) => <option key={m.id} value={m.id}>{m.nombre} {m.apellido_paterno} ({m.numero_empleado})</option>)}
                                    </select>
                                    {errorsCreate.profesor && <span className="text-error text-xs mt-1">{errorsCreate.profesor.message as string}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Descripción Detallada</span></label>
                                    <textarea className="textarea textarea-bordered h-32" {...registerCreate('descripcion', { required: "La descripción es obligatoria" })}></textarea>
                                    {errorsCreate.descripcion && <span className="text-error text-xs mt-1">{errorsCreate.descripcion.message as string}</span>}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                                    <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-warning gap-2"><FileText size={18} /> Guardar en Bitácora</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}></div>
                </div>
            )}

            {/* MODAL RESOLVER */}
            {resolveItem && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md p-0 overflow-hidden">
                        <div className="bg-neutral text-neutral-content p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={24} /> Resolución de Incidencia</h3>
                            <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={() => setResolveItem(null)}>✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-base-200 p-4 rounded-box border border-base-300">
                                <p className="text-xs font-bold uppercase opacity-50 mb-1">Reporte Original:</p>
                                <h4 className="font-bold text-sm mb-1">{resolveItem.titulo}</h4>
                                <p className="text-xs italic opacity-80">"{resolveItem.descripcion}"</p>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Resolución Oficial</span></label>
                                <textarea className="textarea textarea-bordered h-32" {...registerResolve('respuesta', { required: "Debe ingresar una justificación oficial" })}></textarea>
                                {errorsResolve.respuesta && <span className="text-error text-xs mt-1">{errorsResolve.respuesta.message as string}</span>}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-base-300">
                                <button className="btn btn-ghost flex-1" onClick={() => setResolveItem(null)}>Posponer</button>
                                <button className="btn btn-success flex-1 gap-2" onClick={handleSubmitResolve(onResolveSubmit)}><CheckCircle size={18} /> Marcar Resuelta</button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setResolveItem(null)}></div>
                </div>
            )}
        </div>
    );
};

export default GestionIncidencias;
