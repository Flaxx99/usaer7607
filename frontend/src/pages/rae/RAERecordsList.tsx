import { useState } from 'react';
import { 
  FileText, Edit2, CheckCircle, FileSpreadsheet, XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { raeApi } from '../../api/rae';
import type { RegistroRAE } from '../../api/rae';
import { useLoading } from '../../context/LoadingContext';
import { ErrorState } from '../../components/Skeletons';
import { DataTable } from '../../components/DataTable';
import { LoadingButton } from '../../components/LoadingButton';
import type { ColumnDef } from '@tanstack/react-table';

const RAERecordsList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data: recordsData, isLoading, isError, error } = useQuery({
        queryKey: ['rae_records', page, search],
        queryFn: () => raeApi.getMyRecords(page),
    });

    const results = recordsData?.results || [];
    const totalCount = recordsData?.count || 0;

    // Local filter since getMyRecords might not support server-side search
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

    const [exporting, setExporting] = useState(false);

    const handleGenerateRAE = async () => {
        try {
            setExporting(true);
            showLoading();
            const blob = await raeApi.exportAll();
            downloadBlob(blob, `RAE_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Generado!</span>, { description: 'El reporte concentrado RAE ha sido generado.' });
        } catch {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
            setExporting(false);
        }
    };

    const columns: ColumnDef<RegistroRAE>[] = [
        {
            accessorKey: 'escuela_nombre',
            header: 'Escuela',
            cell: ({ row }) => <span className="font-bold text-sm">{row.original.escuela_nombre || 'N/A'}</span>
        },
        {
            accessorKey: 'ciclo_nombre',
            header: 'Ciclo Escolar',
            cell: ({ row }) => <span className="text-sm">{row.original.ciclo_nombre || 'N/A'}</span>
        },
        {
            accessorKey: 'fecha_creacion',
            header: 'Fecha Creación',
            cell: ({ row }) => <span className="text-xs opacity-70">{new Date(row.original.fecha_creacion).toLocaleDateString()}</span>
        },
        {
            id: 'docentes',
            header: 'Docentes (H/M)',
            cell: ({ row }) => (
                <div className="flex justify-center gap-1">
                    <span className="badge badge-outline badge-sm text-blue-600">{row.original.docente_hombres}H</span>
                    <span className="badge badge-outline badge-sm text-pink-600">{row.original.docente_mujeres}M</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <button 
                        className="btn btn-ghost btn-xs text-primary" 
                        onClick={() => navigate(`/rae/capture/${row.original.id}`)}
                        title="Ir a Captura"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        className="btn btn-ghost btn-xs text-success" 
                        onClick={() => navigate(`/rae/validate/${row.original.id}`)}
                        title="Validar y Exportar"
                    >
                        <CheckCircle size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (isError) return <ErrorState error={error} message="Error al cargar los registros RAE. Intenta de nuevo." />;

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
                        <LoadingButton
                            className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            icon={FileSpreadsheet}
                            loading={exporting}
                            onClick={handleGenerateRAE}
                        >
                            Generar RAE
                        </LoadingButton>
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
                placeholder="Buscar escuela o ciclo..."
            />
        </div>
    );
};

export default RAERecordsList;
