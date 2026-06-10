import { useState } from 'react';
import { 
  FileText, Edit2, Plus, Download, FileSpreadsheet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { racApi } from '../../api/rac';
import type { RegistroRAC } from '../../api/rac';
import { useLoading } from '../../context/LoadingContext';
import { ErrorState } from '../../components/Skeletons';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

const RACList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [userRole] = useState(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                return u.role || '';
            } catch { /* ignore */ }
        }
        return '';
    });

    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR' || userRole === 'SECRETARIO';

    const { data: recordsData, isLoading, isError, error } = useQuery({
        queryKey: ['rac_records', page, search],
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
            toast.success('¡Generado! ✅', { description: 'Tu registro RAC ha sido exportado exitosamente.' });
        } catch {
            toast.error('Error ❌', { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
        }
    };

    const handleExportAll = async () => {
        try {
            showLoading();
            const blob = await racApi.exportGlobal();
            downloadBlob(blob, `RAC_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('¡Exportado! ✅', { description: 'El concentrado RAC ha sido generado.' });
        } catch {
            toast.error('Error ❌', { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
        }
    };

    const results = recordsData?.results || [];
    const totalCount = recordsData?.count || 0;

    // Local filter since getRecords might not support server-side search in this specific API
    const filteredRecords = results.filter((r: RegistroRAC) => 
        r.alumno_nombre?.toLowerCase().includes(search.toLowerCase()) || 
        r.curp?.toLowerCase().includes(search.toLowerCase())
    );

    const columns: ColumnDef<RegistroRAC>[] = [
        {
            accessorKey: 'alumno_nombre',
            header: 'Alumno',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                        <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 text-xs font-bold">
                            {row.original.alumno_nombre?.[0]}
                        </div>
                    </div>
                    <span className="font-bold text-sm">{row.original.alumno_nombre}</span>
                </div>
            )
        },
        {
            accessorKey: 'curp',
            header: 'CURP',
            cell: ({ row }) => <span className="font-mono text-xs opacity-70">{row.original.curp}</span>
        },
        {
            accessorKey: 'clasificacion',
            header: 'Clasificación',
            cell: ({ row }) => <span className="badge badge-indigo badge-sm font-bold">{row.original.clasificacion}</span>
        },
        {
            accessorKey: 'subclasificacion',
            header: 'Subclasificación',
            cell: ({ row }) => <span className="text-sm">{row.original.subclasificacion}</span>
        },
        {
            accessorKey: 'maestro_nombre',
            header: 'Maestro de Apoyo',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.maestro_nombre}</span>
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <button 
                        className="btn btn-ghost btn-xs text-indigo-600 hover:bg-indigo-50"
                        onClick={() => navigate(`/rac/editar/${row.original.id}`)}
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (isError) return <ErrorState error={error} message="Error al cargar los registros RAC. Intenta de nuevo." />;

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

            <DataTable 
                data={filteredRecords} 
                columns={columns} 
                isLoading={isLoading}
                totalCount={totalCount}
                page={page}
                onPageChange={setPage}
                onSearchChange={setSearch}
                searchValue={search}
                placeholder="Buscar alumno o CURP..."
            />
        </div>
    );
};

export default RACList;
