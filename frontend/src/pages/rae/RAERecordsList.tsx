import { useState, useMemo } from 'react';
import { 
  FileText, Edit2, CheckCircle, FileSpreadsheet, XCircle, Lock, BarChart3, School
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRAEMyRecords, getRAEProgress, exportAllRAE } from '../../api/rae';
import type { RAEProgressItem, RegistroRAE } from '../../interfaces/rae';
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
        queryFn: () => getRAEMyRecords(page, search),
    });

    const { data: progressData } = useQuery({
        queryKey: ['rae_progress'],
        queryFn: getRAEProgress,
        refetchInterval: 30_000, // refresh each 30s
    });

    const totalCount = recordsData?.count || 0;

    // Merge progress info into records
    const progressMap = useMemo(() => {
        const map = new Map<number, RAEProgressItem>();
        (progressData || []).forEach(p => map.set(p.registro_id, p));
        return map;
    }, [progressData]);

    const recordsWithProgress = useMemo(() => {
        const results = recordsData?.results || [];
        return results.map(r => ({
            ...r,
            _progress: progressMap.get(r.id),
        }));
    }, [recordsData?.results, progressMap]);

    // Overall stats
    const totalEscuelas = progressData?.length || 0;
    const escuelasCompletas = progressData?.filter(p => p.porcentaje === 100 && !p.cerrado).length || 0;
    const escuelasCerradas = progressData?.filter(p => p.cerrado).length || 0;
    const progresoGlobal = totalEscuelas > 0
        ? Math.round(progressData!.reduce((s, p) => s + p.porcentaje, 0) / totalEscuelas)
        : 0;

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
            const blob = await exportAllRAE();
            downloadBlob(blob, `RAE_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Generado!</span>, { description: 'El reporte concentrado RAE ha sido generado.' });
        } catch {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo generar el archivo Excel.' });
        } finally {
            hideLoading();
            setExporting(false);
        }
    };

    const columns: ColumnDef<RegistroRAE & { _progress?: RAEProgressItem }>[] = [
        {
            accessorKey: 'escuela_nombre',
            header: 'Escuela',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{row.original.escuela_nombre || 'N/A'}</span>
                    {row.original.cerrado && (
                        <Lock size={14} className="text-warning" aria-label="Registro cerrado" />
                    )}
                </div>
            )
        },
        {
            id: 'progreso',
            header: 'Captura',
            cell: ({ row }) => {
                const prog = row.original._progress;
                if (!prog) return <span className="text-xs opacity-40">—</span>;
                const pct = prog.porcentaje;
                const color = pct === 100 ? 'progress-success' : pct >= 50 ? 'progress-info' : 'progress-warning';
                return (
                    <div className="flex items-center gap-2 min-w-[120px]">
                        <progress
                            className={`progress ${color} w-20 h-3`}
                            value={pct}
                            max={100}
                        />
                        <span className={`text-xs font-bold ${pct === 100 ? 'text-success' : 'opacity-60'}`}>
                            {pct}%
                        </span>
                        <span className="text-[10px] opacity-40">
                            ({prog.completados}/{prog.total_alumnos})
                        </span>
                    </div>
                );
            }
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
            
            <PageHeader
              icon={FileText}
              title="Registros RAE"
              description="Registro de Atención Educativa y seguimiento de alumnos."
              gradientClass="header-rae"
            >
              <LoadingButton
                className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                icon={FileSpreadsheet}
                loading={exporting}
                onClick={handleGenerateRAE}
              >
                Generar RAE
              </LoadingButton>
            </PageHeader>

            {/* PROGRESS OVERVIEW */}
            {progressData && progressData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BarChart3 size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{progresoGlobal}%</p>
                                <p className="text-xs opacity-50 font-semibold">Progreso Global</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle size={20} className="text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{escuelasCompletas}</p>
                                <p className="text-xs opacity-50 font-semibold">Completas</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Lock size={20} className="text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{escuelasCerradas}</p>
                                <p className="text-xs opacity-50 font-semibold">Cerradas</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-paper">
                        <div className="p-4 flex flex-row items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                                <School size={20} className="text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{totalEscuelas}</p>
                                <p className="text-xs opacity-50 font-semibold">Escuelas</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DataTable 
                data={recordsWithProgress} 
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
