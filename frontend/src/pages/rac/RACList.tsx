import { useState, useEffect } from 'react';
import { 
  FileText, Search, Edit2, Plus, Download, FileSpreadsheet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { racApi } from '../../api/rac';
import type { RegistroRAC } from '../../api/rac';
import { useLoading } from '../../context/LoadingContext';

const RACList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                setUserRole(u.role || '');
            } catch { /* ignore */ }
        }
    }, []);

    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR' || userRole === 'SECRETARIO';

    const { data: recordsData, isLoading } = useQuery({
        queryKey: ['rac_records', page],
        queryFn: () => racApi.getRecords(page),
    });

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleGenerateRAC = async () => {
        try {
            showLoading();
            const blob = await racApi.exportMyRecords();
            downloadBlob(blob, `RAC_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('RAC Generado', { description: 'Tu registro RAC ha sido exportado exitosamente.' });
        } catch {
            toast.error('Error de Exportación', { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
        }
    };

    const handleExportAll = async () => {
        try {
            showLoading();
            const blob = await racApi.exportGlobal();
            downloadBlob(blob, `RAC_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Exportación Exitosa', { description: 'El concentrado RAC ha sido generado.' });
        } catch {
            toast.error('Error de Exportación', { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
        }
    };

    const results = recordsData?.results || [];
    const totalCount = recordsData?.count || 0;

    const filteredRecords = results.filter((r: RegistroRAC) => 
        r.alumno_nombre?.toLowerCase().includes(search.toLowerCase()) || 
        r.curp?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* CABECERA */}
            <div className="card bg-indigo-600 text-white shadow-lg border-l-8 border-indigo-900">
                <div className="card-body p-8 flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Registros RAC
                            </h1>
                            <p className="text-sm opacity-90 font-medium">
                                Registro de Alumnos con Discapacidad o Aptitudes Sobresalientes.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            onClick={handleGenerateRAC}
                            title="Generar RAC con tus registros"
                        >
                            <FileSpreadsheet size={20} />
                            Generar RAC
                        </button>
                        {isAdmin && (
                            <button 
                                className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                                onClick={handleExportAll}
                                title="Exportar concentrado global (Admin/Secretario)"
                            >
                                <Download size={20} />
                                Exportar Todo
                            </button>
                        )}
                        <button 
                            className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                            onClick={() => navigate('/rac/nuevo')}
                        >
                            <Plus size={22} />
                            Nuevo Registro
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA CON BÚSQUEDA INTEGRADA */}
            <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-base-200">
                    <h3 className="font-bold text-base">Listado de Registros</h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar alumno o CURP..." 
                            className="input input-bordered pl-10 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-md table-zebra w-full">
                        <thead className="bg-base-200">
                            <tr className="text-xs uppercase opacity-60">
                                <th>Alumno</th>
                                <th>CURP</th>
                                <th>Clasificación</th>
                                <th>Subclasificación</th>
                                <th>Maestro de Apoyo</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <span className="loading loading-spinner loading-lg text-primary"></span>
                                        <p className="mt-2 text-base-content/50 font-medium">Cargando registros...</p>
                                    </td>
                                </tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((rec: RegistroRAC) => (
                                    <tr key={rec.id} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                    <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 text-xs font-bold">
                                                        {rec.alumno_nombre?.[0]}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm">{rec.alumno_nombre}</span>
                                            </div>
                                        </td>
                                        <td className="font-mono text-xs opacity-70">{rec.curp}</td>
                                        <td>
                                            <span className="badge badge-indigo badge-sm font-bold">{rec.clasificacion}</span>
                                        </td>
                                        <td className="text-sm">{rec.subclasificacion}</td>
                                        <td className="text-sm font-medium">{rec.maestro_nombre}</td>
                                        <td className="text-right">
                                            <button 
                                                className="btn btn-ghost btn-xs text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => navigate(`/rac/editar/${rec.id}`)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-base-content/40 italic">
                                        No se encontraron registros RAC.
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

export default RACList;
