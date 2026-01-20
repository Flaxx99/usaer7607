import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, MapPin, Search } from 'lucide-react';
import { getHistorialAsistencia } from '../../api/asistencia';

const HistorialAsistencia = () => {
    const [fechaFiltro, setFechaFiltro] = useState('');

    const { data: asistencias, isLoading } = useQuery({
        queryKey: ['asistencias', fechaFiltro],
        queryFn: () => getHistorialAsistencia(fechaFiltro ? { fecha: fechaFiltro } : {}),
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Clock className="text-primary" /> Historial de Asistencia
                    </h1>
                    <p className="text-text-secondary">Consulta tus registros de entrada y salida.</p>
                </div>
                
                {/* Filtro Fecha */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <Calendar size={18} className="text-slate-400" />
                    <input 
                        type="date" 
                        className="outline-none text-sm text-slate-600"
                        onChange={(e) => setFechaFiltro(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Escuela</th>
                            <th className="p-4 text-center">Entrada</th>
                            <th className="p-4 text-center">Salida</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Cargando...</td></tr>
                        ) : asistencias?.map((asis) => (
                            <tr key={asis.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium">{asis.fecha}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        {asis.escuela_nombre}
                                    </div>
                                    <span className="text-xs text-slate-400 block ml-6">{asis.profesor_nombre}</span>
                                </td>
                                <td className="p-4 text-center font-mono text-emerald-600 font-bold bg-emerald-50/50 rounded">
                                    {asis.hora_entrada}
                                </td>
                                <td className="p-4 text-center font-mono text-blue-600 font-bold">
                                    {asis.hora_salida || '--:--'}
                                </td>
                                <td className="p-4 text-center">
                                    {asis.hora_salida ? (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">COMPLETO</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse">EN CURSO</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {asistencias?.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay registros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistorialAsistencia;