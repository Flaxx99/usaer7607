import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { getHistorialAsistencia } from '../../api/asistencia';
import { TableSkeleton, EmptyState, ErrorState } from '../../components/Skeletons';

const HistorialAsistencia = () => {
    const [fechaFiltro, setFechaFiltro] = useState<string | null>(null);

    const { data: asistencias, isLoading, isError, error } = useQuery({
        queryKey: ['asistencias', fechaFiltro],
        queryFn: () => getHistorialAsistencia(fechaFiltro ? { fecha: fechaFiltro } : {}),
    });

    if (isError) return <ErrorState error={error} message="Error al cargar el historial de asistencia. Intenta de nuevo." />;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* CABECERA */}
            <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Historial de Asistencia
                            </h1>
                            <p className="text-sm opacity-90 font-medium">
                                Consulta tus registros de entrada y salida.
                            </p>
                        </div>
                    </div>
                    
                    {/* Filtro Fecha */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
                            <input 
                                type="date" 
                                className="input input-bordered bg-white/10 text-white border-white/30 pl-10 focus:bg-white/20 focus:outline-none"
                                value={fechaFiltro || ''}
                                onChange={(e) => setFechaFiltro(e.target.value || null)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA DE ASISTENCIA */}
            <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                {isLoading ? (
                    <TableSkeleton rows={10} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead className="bg-base-200">
                                <tr className="text-xs uppercase opacity-60">
                                    <th>Fecha</th>
                                    <th>Escuela / Profesor</th>
                                    <th className="text-center">Entrada</th>
                                    <th className="text-center">Salida</th>
                                    <th className="text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asistencias?.map((asis) => (
                                    <tr key={asis.id} className="hover">
                                        <td>
                                            <span className="font-bold text-sm text-base-content">{asis.fecha}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-base-content/40" />
                                                    <span className="text-sm font-semibold text-base-content/80">{asis.escuela_nombre}</span>
                                                </div>
                                                <span className="text-xs opacity-50 ml-5">{asis.profesor_nombre}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-sm font-bold text-success font-mono">
                                                {asis.hora_entrada}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-sm font-bold text-info font-mono">
                                                {asis.hora_salida || '--:--'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {asis.hora_salida ? (
                                                <span className="badge badge-ghost badge-sm font-bold">COMPLETO</span>
                                            ) : (
                                                <span className="badge badge-warning badge-sm font-bold">EN CURSO</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!isLoading && asistencias?.length === 0 && (
                            <EmptyState icon={Clock} title="No hay registros de asistencia para este periodo." />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialAsistencia;
