import { useState } from 'react';
import { 
  FileText, Edit2, Plus, Download, FileSpreadsheet,
  CheckCircle, XCircle
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRACRecords, exportMyRACRecords, exportGlobalRAC } from '../../api/rac';
import type { RegistroRAC } from '../../interfaces/rac';
import { useLoading } from '../../context/LoadingContext';
import { ErrorState } from '../../components/Skeletons';
import { DataTable } from '../../components/DataTable';
import { LoadingButton } from '../../components/LoadingButton';
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
        queryFn: () => getRACRecords(page),
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

    const [exporting, setExporting] = useState<'none' | 'mine' | 'all'>('none');

    const handleGenerateRAC = async () => {
        try {
            setExporting('mine');
            showLoading();
            const blob = await exportMyRACRecords();
            downloadBlob(blob, `RAC_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Generado!</span>, { description: 'Tu registro RAC ha sido exportado exitosamente.' });
        } catch {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
            setExporting('none');
        }
    };

    const handleExportAll = async () => {
        try {
            setExporting('all');
            showLoading();
            const blob = await exportGlobalRAC();
            downloadBlob(blob, `RAC_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Exportado!</span>, { description: 'El concentrado RAC ha sido generado.' });
        } catch {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
            setExporting('none');
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
                        <div className="bg-primary/10 text-primary rounded-full w-8 h-8 text-xs font-bold">
                            {row.original.alumno_nombre?.[0] || '?'}
                        </div>
                    </div>
                    <span className="font-bold text-sm">{row.original.alumno_nombre || '—'}</span>
                </div>
            )
        },
        {
            accessorKey: 'curp',
            header: 'CURP',
            cell: ({ row }) => <span className="font-mono text-xs opacity-70">{row.original.curp || '—'}</span>
        },
        {
            accessorKey: 'clasificacion',
            header: 'Clasificación',
            cell: ({ row }) => {
                const cls = row.original.clasificacion;
                const badgeColor = 
                    cls === 'NINGUNO' ? 'badge-ghost' :
                    cls === 'DISCAPACIDAD' ? 'badge-info' :
                    cls === 'DIFICULTADES_SEVERAS' ? 'badge-warning' :
                    cls === 'TRASTORNOS' ? 'badge-error' : 'badge-secondary';
                return <span className={`badge badge-sm font-bold ${badgeColor}`}>{cls?.replace(/_/g, ' ') || '—'}</span>;
            }
        },
        {
            accessorKey: 'subclasificacion',
            header: 'Subclasificación',
            cell: ({ row }) => <span className="text-sm">{row.original.subclasificacion || '—'}</span>
        },
        {
            accessorKey: 'maestro_nombre',
            header: 'Maestro de Apoyo',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.maestro_nombre || '—'}</span>
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <button 
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/rac/editar/${row.original.id}`)}
                        title="Editar registro"
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
            
            <PageHeader
                icon={FileText}
                title="Registros RAC"
                description="Registro de Alumnos con Discapacidad o Aptitudes Sobresalientes."
                gradientClass="header-documentos"
            >
                <LoadingButton
                    className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    icon={FileSpreadsheet}
                    loading={exporting === 'mine'}
                    onClick={handleGenerateRAC}
                >
                    Generar RAC
                </LoadingButton>
                {isAdmin && (
                    <LoadingButton
                        className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        icon={Download}
                        loading={exporting === 'all'}
                        onClick={handleExportAll}
                    >
                        Exportar Todo
                    </LoadingButton>
                )}
                <button 
                    className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                    onClick={() => navigate('/rac/nuevo')}
                >
                    <Plus size={22} />
                    Nuevo Registro
                </button>
            </PageHeader>

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
