import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    FileText, Plus, CheckCircle, XCircle, Clock, 
    Calendar, User, AlertCircle, Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { getPermisos, getMetricasPermisos, createPermiso, responderPermiso, deletePermiso } from '../../api/permisos';
import type { Permiso, EstadoPermiso } from '../../interfaces/permisos';
import Modal from '../../components/Modal';

// Diccionario de colores para los estados
const STATE_COLORS = {
    PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
    APROBADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    RECHAZADO: 'bg-rose-100 text-rose-700 border-rose-200',
};

// Tipos de permiso para el Select
const TIPOS_PERMISO = [
    { value: 'PERSONAL', label: 'Asuntos Personales' },
    { value: 'ENFERMEDAD', label: 'Enfermedad' },
    { value: 'COMISION', label: 'Comisión Oficial' },
    { value: 'LLEGADA_TARDE', label: 'Llegada Tarde' },
    { value: 'SALIDA_TEMPRANA', label: 'Salida Temprana' },
];

const GestionPermisos = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [permisoSeleccionado, setPermisoSeleccionado] = useState<Permiso | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [isAdminOrDirector, setIsAdminOrDirector] = useState(false);

    // React Hook Form para crear
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<Permiso>>();
    // React Hook Form para responder
    const { register: registerRes, handleSubmit: handleSubmitRes, reset: resetRes } = useForm<{motivo_respuesta: string}>();

    // Detectar si requiere horas (para tipos parciales)
    const tipoSeleccionado = watch('tipo');
    const esPermisoPorHoras = tipoSeleccionado === 'LLEGADA_TARDE' || tipoSeleccionado === 'SALIDA_TEMPRANA';

    // --- DETECTAR ROL ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            // Ajusta estos valores según tus códigos de rol exactos en BD
            if (['ADMIN', 'DIRECTOR', 'ADMINISTRADOR'].includes(user.role)) {
                setIsAdminOrDirector(true);
            }
        }
    }, []);

    // --- QUERIES ---
    const { data: permisos, isLoading } = useQuery({
        queryKey: ['permisos', filtroEstado],
        queryFn: () => getPermisos(filtroEstado ? { estado: filtroEstado } : {}),
    });

    const { data: metricas } = useQuery({
        queryKey: ['permisos-metricas'],
        queryFn: getMetricasPermisos,
        enabled: isAdminOrDirector // Solo cargar métricas si es autoridad
    });

    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createPermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsCreateModalOpen(false);
            reset();
            Swal.fire('Solicitud Enviada', 'Tu permiso ha sido registrado y notificado.', 'success');
        },
        onError: (err: any) => Swal.fire('Error', err.response?.data?.detail || 'Revisa las fechas.', 'error')
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, estado, respuesta }: { id: number, estado: EstadoPermiso, respuesta: string }) => 
            responderPermiso(id, estado, respuesta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsResponseModalOpen(false);
            resetRes();
            Swal.fire('Procesado', 'El permiso ha sido actualizado.', 'success');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            Swal.fire('Eliminado', 'La solicitud ha sido eliminada.', 'success');
        }
    });

    // --- HANDLERS ---
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
        Swal.fire({
            title: '¿Cancelar solicitud?',
            text: "Solo puedes borrar solicitudes pendientes.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar'
        }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
    };

    const abrirModalRespuesta = (permiso: Permiso) => {
        setPermisoSeleccionado(permiso);
        resetRes();
        setIsResponseModalOpen(true);
    };

    const formatDate = (dateStr: string) => {
        try { return format(new Date(dateStr), "dd MMM yyyy", { locale: es }); } catch { return dateStr; }
    };

    if (isLoading) return <div className="p-8 text-center text-primary">Cargando permisos...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <FileText className="text-primary" /> Gestión de Permisos
                    </h1>
                    <p className="text-text-secondary">
                        {isAdminOrDirector ? 'Administra y autoriza las solicitudes del personal.' : 'Solicita y consulta el estado de tus permisos.'}
                    </p>
                </div>
                <button 
                    onClick={() => { reset(); setIsCreateModalOpen(true); }}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium"
                >
                    <Plus size={20} /> Nueva Solicitud
                </button>
            </div>

            {/* MÉTRICAS (SOLO ADMIN/DIRECTOR) */}
            {isAdminOrDirector && metricas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Pendientes" value={metricas.pendientes} color="bg-amber-50 text-amber-700" icon={<Clock size={18}/>} />
                    <StatBox label="Aprobados" value={metricas.aprobados} color="bg-emerald-50 text-emerald-700" icon={<CheckCircle size={18}/>} />
                    <StatBox label="Rechazados" value={metricas.rechazados} color="bg-rose-50 text-rose-700" icon={<XCircle size={18}/>} />
                    <StatBox label="Total" value={metricas.total} color="bg-blue-50 text-blue-700" icon={<FileText size={18}/>} />
                </div>
            )}

            {/* FILTROS DE ESTADO */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
                {['', 'PENDIENTE', 'APROBADO', 'RECHAZADO'].map((st) => (
                    <button
                        key={st}
                        onClick={() => setFiltroEstado(st)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            filtroEstado === st 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {st === '' ? 'TODOS' : st}
                    </button>
                ))}
            </div>

            {/* LISTA DE PERMISOS */}
            <div className="grid gap-4">
                {permisos?.map((p) => (
                    <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-4">
                        {/* Fecha y Estado */}
                        <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-slate-100 pr-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-full text-center border ${STATE_COLORS[p.estado] || 'bg-slate-100'}`}>
                                {p.estado}
                            </span>
                            <div className="mt-2 text-center">
                                <span className="text-2xl font-bold text-slate-700">{formatDate(p.fecha_inicio).split(' ')[0]}</span>
                                <span className="block text-xs text-slate-500 uppercase">{formatDate(p.fecha_inicio).split(' ')[1]}</span>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        {p.tipo.replace('_', ' ')}
                                        {p.horas_solicitadas && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.horas_solicitadas} hrs</span>}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <User size={14}/> {p.profesor_nombre} 
                                        <span className="text-slate-300">|</span> 
                                        {p.escuela_nombre}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-slate-400">
                                    <p>Solicitado: {formatDate(p.fecha_solicitud)}</p>
                                    <p className="mt-1 font-medium text-slate-600 flex items-center justify-end gap-1">
                                        <Calendar size={12}/> {p.duracion_dias} día(s)
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm text-slate-600 border border-slate-100">
                                <span className="font-bold text-slate-700">Motivo:</span> {p.motivo}
                            </div>

                            {p.respuesta_admin && (
                                <div className={`mt-2 p-3 rounded-lg text-sm border ${p.estado === 'APROBADO' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                                    <span className="font-bold">Respuesta ({p.administrador_nombre}):</span> {p.respuesta_admin}
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col justify-center gap-2 border-l border-slate-100 pl-4 min-w-[120px]">
                            {/* SI ES ADMIN/DIRECTOR Y ESTÁ PENDIENTE -> RESPONDER */}
                            {isAdminOrDirector && p.estado === 'PENDIENTE' && (
                                <button 
                                    onClick={() => abrirModalRespuesta(p)}
                                    className="w-full bg-slate-800 text-white text-xs py-2 rounded hover:bg-slate-700 transition-colors"
                                >
                                    Gestionar
                                </button>
                            )}

                            {/* SI ES MI PERMISO Y ESTÁ PENDIENTE -> BORRAR */}
                            {!isAdminOrDirector && p.estado === 'PENDIENTE' && (
                                <button 
                                    onClick={() => handleDelete(p.id)}
                                    className="w-full border border-red-200 text-red-600 text-xs py-2 rounded hover:bg-red-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {permisos?.length === 0 && (
                    <div className="text-center p-10 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                        <Search className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No se encontraron permisos con este filtro.</p>
                    </div>
                )}
            </div>

            {/* --- MODAL CREAR --- */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Solicitud de Permiso">
                <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Permiso</label>
                        <select {...register('tipo', { required: true })} className="w-full border p-2 rounded text-sm">
                            {TIPOS_PERMISO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Inicio</label>
                            <input type="date" {...register('fecha_inicio', { required: true })} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Fin</label>
                            <input type="date" {...register('fecha_fin', { required: true })} className="w-full border p-2 rounded text-sm" />
                        </div>
                    </div>

                    {esPermisoPorHoras && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                            <label className="block text-xs font-bold text-blue-700 mb-1">Horas solicitadas</label>
                            <input 
                                type="number" step="0.5" 
                                {...register('horas_solicitadas', { required: true, min: 0.5, max: 8 })} 
                                className="w-full border p-2 rounded text-sm" 
                                placeholder="Ej. 2.0"
                            />
                            {errors.horas_solicitadas && <span className="text-xs text-red-500">Requerido (0.5 - 8 hrs)</span>}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Motivo (Sé específico)</label>
                        <textarea {...register('motivo', { required: true, minLength: 5 })} rows={3} className="w-full border p-2 rounded text-sm resize-none"></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Enviar Solicitud</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL RESPONDER (ADMIN) --- */}
            <Modal isOpen={isResponseModalOpen} onClose={() => setIsResponseModalOpen(false)} title="Gestionar Solicitud">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded text-sm">
                        <p><span className="font-bold">Solicitante:</span> {permisoSeleccionado?.profesor_nombre}</p>
                        <p><span className="font-bold">Motivo:</span> {permisoSeleccionado?.motivo}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Respuesta / Justificación *</label>
                        <textarea 
                            {...registerRes('motivo_respuesta', { required: true })} 
                            rows={3} 
                            className="w-full border p-2 rounded text-sm resize-none"
                            placeholder="Escribe una respuesta para el profesor..."
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button 
                            onClick={handleSubmitRes((d) => handleResponder(d, 'RECHAZADO'))}
                            className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 py-2 rounded font-bold hover:bg-rose-100"
                        >
                            RECHAZAR
                        </button>
                        <button 
                            onClick={handleSubmitRes((d) => handleResponder(d, 'APROBADO'))}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold hover:bg-emerald-700 shadow-sm"
                        >
                            APROBAR
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Componente pequeño para las tarjetas de métricas
const StatBox = ({ label, value, color, icon }: any) => (
    <div className={`p-4 rounded-xl flex items-center justify-between ${color} border border-current border-opacity-20`}>
        <div>
            <p className="text-xs font-bold uppercase opacity-70">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
    </div>
);

export default GestionPermisos;