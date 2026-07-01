import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, MapPin, BarChart3, Timer, CheckCircle, Play } from 'lucide-react';
import { getHistorialAsistencia } from '../../api/asistencia';
import { TableSkeleton, EmptyState, ErrorState } from '../../components/Skeletons';
import type { Asistencia } from '../../interfaces/asistencia';

/** Calcula horas entre dos strings HH:MM:SS */
const diffHoras = (entrada: string, salida: string): number => {
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);
    return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
};

const HistorialAsistencia = () => {
    const [fechaFiltro, setFechaFiltro] = useState<string | null>(null);

    const { data: asistencias, isLoading, isError, error } = useQuery({
        queryKey: ['asistencias', fechaFiltro],
        queryFn: () => getHistorialAsistencia(fechaFiltro ? { fecha: fechaFiltro } : {}),
    });

    const stats = useMemo(() => {
        const list = asistencias || [];
        const total = list.length;
        const completos = list.filter((a: Asistencia) => a.hora_salida).length;
        const enCurso = total - completos;
        const horasArr = list
            .filter((a: Asistencia) => a.hora_salida)
            .map((a: Asistencia) => diffHoras(a.hora_entrada!, a.hora_salida!));
        const promedio = horasArr.length > 0
            ? Math.round(horasArr.reduce((s: number, h: number) => s + h, 0) / horasArr.length * 10) / 10
            : 0;
        return { total, completos, enCurso, promedio };
    }, [asistencias]);

    if (isError) return <ErrorState error={error} message="Error al cargar el historial de asistencia. Intenta de nuevo." />;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* CABECERA CON GRADIENTE */}
            <div className="header-section header-asistencias">
                <div className="header-pattern" />
                <div className="header-circle header-circle-lg" />
                <div className="header-circle header-circle-sm" />
                <div className="relative z-10 p-8 flex-row items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
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
                                className="input bg-white/10 text-white border-white/30 pl-10 focus:bg-white/20 focus:outline-none placeholder:text-white/40"
                                value={fechaFiltro || ''}
                                onChange={(e) => setFechaFiltro(e.target.value || null)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS CARDS */}
            {!isLoading && asistencias && asistencias.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BarChart3 size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.total}</p>
                                <p className="text-xs opacity-50 font-semibold">Registros</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle size={20} className="text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.completos}</p>
                                <p className="text-xs opacity-50 font-semibold">Completos</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Play size={20} className="text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.enCurso}</p>
                                <p className="text-xs opacity-50 font-semibold">En curso</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                                <Timer size={20} className="text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.promedio}h</p>
                                <p className="text-xs opacity-50 font-semibold">Promedio</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA DE ASISTENCIA */}
            <div className="card-paper overflow-hidden">
                {isLoading ? (
                    <TableSkeleton rows={10} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead className="bg-base-200">
                                <tr className="text-xs uppercase font-bold tracking-wider text-base-content/70">
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
