import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { 
    AlertTriangle, CheckCircle, Clock, Plus, Search, 
    MessageSquare, User, FileText, X 
} from 'lucide-react';
import Modal from '../../components/Modal'; // Asegúrate de tener tu componente Modal genérico
import { getIncidencias, createIncidencia, resolverIncidencia, getMaestrosParaSelect } from '../../api/incidencias';
import type { Incidencia, IncidenciaInput } from '../../interfaces/incidencia';

const GestionIncidencias = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [resolveItem, setResolveItem] = useState<Incidencia | null>(null); // Si no es null, el modal de resolver está abierto
    const [filtro, setFiltro] = useState('');

    // --- QUERIES ---
    const { data: incidencias, isLoading } = useQuery({
        queryKey: ['incidencias'],
        queryFn: getIncidencias,
    });

    const { data: maestros } = useQuery({
        queryKey: ['maestros-select'],
        queryFn: getMaestrosParaSelect,
        enabled: isCreateOpen, // Solo cargar si abren el modal
    });

    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createIncidencia,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Actualizar contador dashboard
            setIsCreateOpen(false);
            Swal.fire('Registrado', 'La incidencia ha sido reportada.', 'success');
        },
        onError: () => Swal.fire('Error', 'No se pudo crear la incidencia.', 'error')
    });

    const resolveMutation = useMutation({
        mutationFn: (data: { id: number, respuesta: string }) => resolverIncidencia(data.id, { respuesta_admin: data.respuesta }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setResolveItem(null);
            Swal.fire('Resuelta', 'La incidencia ha sido cerrada correctamente.', 'success');
        },
        onError: () => Swal.fire('Error', 'No se pudo resolver la incidencia.', 'error')
    });

    // --- FORMS ---
    const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate } = useForm<IncidenciaInput>();
    const { register: registerResolve, handleSubmit: handleSubmitResolve, reset: resetResolve } = useForm<{ respuesta: string }>();

    // --- HANDLERS ---
    const onCreateSubmit = (data: IncidenciaInput) => {
        createMutation.mutate(data);
        resetCreate();
    };

    const onResolveSubmit = (data: { respuesta: string }) => {
        if (resolveItem) {
            resolveMutation.mutate({ id: resolveItem.id, respuesta: data.respuesta });
            resetResolve();
        }
    };

    // Filtrado local
    const dataFiltrada = incidencias?.filter(i => 
        i.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
        i.profesor_nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" /> Bitácora de Incidencias
                    </h1>
                    <p className="text-text-secondary">Reporte y seguimiento de situaciones escolares.</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus size={18} /> Nueva Incidencia
                </button>
            </div>

            {/* Buscador */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por título o profesor..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Asunto</th>
                            <th className="p-4">Involucrado</th>
                            <th className="p-4">Reportado Por</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Cargando bitácora...</td></tr>
                        ) : dataFiltrada?.map((inc) => (
                            <tr key={inc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4">
                                    <p className="font-bold text-slate-800">{inc.titulo}</p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {inc.fecha_reporte}
                                    </p>
                                    {inc.respuesta_admin && (
                                        <div className="mt-2 text-xs bg-green-50 text-green-700 p-2 rounded border border-green-100">
                                            <strong>Resolución:</strong> {inc.respuesta_admin}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400"/>
                                        {inc.profesor_nombre}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-500">
                                    {inc.reportado_por_nombre}
                                </td>
                                <td className="p-4 text-center">
                                    {inc.estado === 'PENDIENTE' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                            <Clock size={12} /> Pendiente
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                            <CheckCircle size={12} /> Resuelta
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {inc.estado === 'PENDIENTE' && (
                                        <button 
                                            onClick={() => setResolveItem(inc)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                                        >
                                            Responder
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {dataFiltrada?.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay incidencias registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL 1: CREAR INCIDENCIA --- */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Reportar Nueva Incidencia">
                <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título del Reporte</label>
                        <input 
                            {...registerCreate('titulo', { required: true })}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none"
                            placeholder="Ej. Accidente en recreo"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Profesor/Personal Involucrado</label>
                        <select 
                            {...registerCreate('profesor', { required: true })}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none bg-white"
                        >
                            <option value="">-- Seleccione al profesor --</option>
                            {maestros?.map((m: any) => (
                                <option key={m.id} value={m.id}>
                                    {m.nombre} {m.apellido_paterno} ({m.numero_empleado})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Si es alumno, seleccione al maestro a cargo.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Detallada</label>
                        <textarea 
                            {...registerCreate('descripcion', { required: true })}
                            rows={4}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none"
                            placeholder="Describa qué sucedió, hora aproximada y acciones tomadas..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Guardar Reporte</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL 2: RESOLVER INCIDENCIA --- */}
            <Modal isOpen={!!resolveItem} onClose={() => setResolveItem(null)} title={`Resolver: ${resolveItem?.titulo}`}>
                <form onSubmit={handleSubmitResolve(onResolveSubmit)} className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 border border-slate-200">
                        <p className="font-bold mb-1">Descripción original:</p>
                        <p>{resolveItem?.descripcion}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Respuesta / Resolución</label>
                        <textarea 
                            {...registerResolve('respuesta', { required: true })}
                            rows={4}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                            placeholder="Indique las acciones tomadas para cerrar este caso..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setResolveItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Marcar como Resuelta</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GestionIncidencias;