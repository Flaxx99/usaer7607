import { useState } from 'react';
import { 
  Search, Edit2, FileText, CheckCircle, FileSpreadsheet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { raeApi } from '../../api/rae';
import type { RegistroRAE } from '../../api/rae';
import { useLoading } from '../../context/LoadingContext';

const RAERecordsList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data: recordsData, isLoading } = useQuery({
        queryKey: ['rae_records', page],
        queryFn: () => raeApi.getMyRecords(page),
    });

    const results = recordsData?.results || [];
    const totalCount = recordsData?.count || 0;

    const filteredRecords = results.filter((r: RegistroRAE) => 
        r.escuela_nombre?.toLowerCase().includes(search.toLowerCase()) || 
        r.ciclo_nombre?.toLowerCase().includes(search.toLowerCase())
    );

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleGenerateRAE = async () => {
        try {
            showLoading();
            const blob = await raeApi.exportAll();
            downloadBlob(blob, `RAE_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('RAE Generado', { description: 'El reporte concentrado RAE ha sido generado.' });
        } catch {
            toast.error('Error al Generar', { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* CABECERA */}
            <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Registros RAE
                            </h1>
                            <p className="text-sm opacity-90 font-medium">
                                Registro de Atención Educativa y seguimiento de alumnos.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            onClick={handleGenerateRAE}
                            title="Generar reporte RAE con todas las escuelas"
                        >
                            <FileSpreadsheet size={20} />
                            Generar RAE
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="card bg-base-100 shadow-sm border border-base-300 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold">Historial de Capturas</h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar escuela o ciclo..." 
                            className="input input-bordered pl-10 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLA */}
            <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                            <tr className="text-xs uppercase opacity-60">
                                <th>Escuela</th>
                                <th>Ciclo Escolar</th>
                                <th>Fecha Creación</th>
                                <th className="text-center">Docentes (H/M)</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <span className="loading loading-spinner loading-lg text-primary"></span>
                                        <p className="mt-2 text-base-content/50 font-medium">Cargando registros...</p>
                                    </td>
                                </tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((rec: RegistroRAE) => (
                                    <tr key={rec.id} className="hover">
                                        <td className="font-bold text-sm">{rec.escuela_nombre || 'N/A'}</td>
                                        <td className="text-sm">{rec.ciclo_nombre || 'N/A'}</td>
                                        <td className="text-xs opacity-70">{new Date(rec.fecha_creacion).toLocaleDateString()}</td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-1">
                                                <span className="badge badge-outline badge-sm text-blue-600">{rec.docente_hombres}H</span>
                                                <span className="badge badge-outline badge-sm text-pink-600">{rec.docente_mujeres}M</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="btn btn-ghost btn-xs text-primary" 
                                                    onClick={() => navigate(`/rae/capture/${rec.id}`)}
                                                    title="Ir a Captura"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="btn btn-ghost btn-xs text-success" 
                                                    onClick={() => navigate(`/rae/validate/${rec.id}`)}
                                                    title="Validar y Exportar"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-base-content/40 italic">
                                        No hay registros RAE disponibles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex justify-center p-4 border-t border-base-200">
                    <div className="join">
                        <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
                        <button className="join-item btn btn-sm no-animation">{page} / {Math.ceil(totalCount / 10)}</button>
                        <button className="join-item btn btn-sm" disabled={page >= Math.ceil(totalCount / 10)} onClick={() => setPage(p => p + 1)}>»</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RAERecordsList;
