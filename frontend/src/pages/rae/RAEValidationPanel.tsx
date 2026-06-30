import { useState } from 'react';
import { 
  ArrowLeft, Download, Eye, Users, CheckCircle, XCircle, Lock, Unlock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { raeApi } from '../../api/rae';
import type { RAEAlumno } from '../../interfaces/rae';
import { useLoading } from '../../context/LoadingContext';
import { ValidationSkeleton, EmptyState, ErrorState } from '../../components/Skeletons';
import { LoadingButton } from '../../components/LoadingButton';

const RAEValidationPanel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    const [selectedTotal, setSelectedTotal] = useState<{ field: string, value: boolean } | null>(null);

    const { data: initData, isLoading, isError, error } = useQuery({
        queryKey: ['rae_capture', id],
        queryFn: raeApi.initCapture,
        enabled: !!id,
    });

    const cerrado = initData?.cerrado ?? false;

    const cerrarMutation = useMutation({
        mutationFn: (nuevoEstado: boolean) => raeApi.cerrarRegistro(Number(id), nuevoEstado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rae_capture', id] });
            queryClient.invalidateQueries({ queryKey: ['rae_records'] });
            queryClient.invalidateQueries({ queryKey: ['rae_progress'] });
        },
    });

    const [exporting, setExporting] = useState(false);

    const handleCerrar = async () => {
        const accion = cerrado ? 'reabrir' : 'cerrar';
        if (!confirm(`¿Estás seguro de ${accion} este registro RAE?`)) return;
        try {
            showLoading();
            await cerrarMutation.mutateAsync(!cerrado);
            toast.success(`Registro ${cerrado ? 'reabierto' : 'cerrado'} exitosamente.`);
        } catch {
            toast.error('Error al cambiar el estado del registro.');
        } finally {
            hideLoading();
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            showLoading();
            const blob = await raeApi.exportExcel(Number(id));
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RAE_Oficial_${initData?.escuela}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Generado!</span>, { description: 'El archivo oficial RAE ha sido descargado.' });
        } catch {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo generar el archivo.' });
        } finally {
            hideLoading();
            setExporting(false);
        }
    };

    const calculateTotal = (field: keyof RAEAlumno) => {
        return initData?.alumnos.filter(a => a[field] === true).length || 0;
    };

    const getAlumnosForField = (field: keyof RAEAlumno) => {
        return initData?.alumnos.filter(a => a[field] === true) || [];
    };

    const categories = [
        { label: 'Discapacidad', fields: ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm'] },
        { label: 'Dificultades', fields: ['dsc', 'dsco', 'dsa'] },
        { label: 'Sobr.', fields: ['asi', 'asc', 'ass', 'asa', 'asp', 'ot'] },
        { label: 'Apoyos', fields: ['psicologia', 'comunicacion', 'psicomotricidad', 'trabajo_social', 'aprendizaje'] },
        { label: 'Portafolio', fields: ['diagnostico', 'educativo', 'deteccion', 'psicopedagogico', 'plan', 'modelo'] },
    ];

    if (isError) return <ErrorState error={error} message="Error al cargar el panel de validación. Intenta de nuevo." />;

    if (isLoading) return <ValidationSkeleton />;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            {/* Page header card */}
            <div className="card bg-base-100 border border-base-300 shadow-sm">
                <div className="card-body p-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-start gap-3">
                            <button 
                                className="btn btn-ghost btn-sm gap-2 mt-0.5"
                                onClick={() => navigate('/rae/capture/' + id)}
                            >
                                <ArrowLeft size={16} />
                                Volver a Captura
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-black tracking-tight">Validación de Totales RAE</h1>
                                    <p className="text-sm text-base-content/60 mt-0.5">Verificá los totales registrados por categoría</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className={`btn btn-sm gap-2 ${cerrado ? 'btn-warning' : 'btn-outline btn-warning'}`}
                                onClick={handleCerrar}
                                disabled={cerrarMutation.isPending}
                            >
                                {cerrado ? <Unlock size={16} /> : <Lock size={16} />}
                                {cerrado ? 'Reabrir Registro' : 'Cerrar Registro'}
                            </button>
                            <LoadingButton
                                className="btn btn-success btn-sm px-6 gap-2"
                                icon={Download}
                                loading={exporting}
                                onClick={handleExport}
                            >
                                Descargar Archivo Oficial
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            </div>

            {cerrado && (
                <div className="alert alert-warning shadow-sm">
                    <Lock size={20} />
                    <span className="font-semibold">Este registro RAE está cerrado.</span>
                    <span className="text-sm opacity-70">No se pueden modificar los datos de captura. Solo un administrador o secretario puede reabrirlo.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categories.map(cat => (
                    <div key={cat.label} className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body p-5 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">
                                {cat.label}
                            </h3>
                            <div className="flex flex-col gap-2">
                                {cat.fields.map(f => {
                                    const total = calculateTotal(f as keyof RAEAlumno);
                                    return (
                                        <div 
                                            key={f} 
                                            className="flex items-center justify-between p-2 bg-base-200 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors group"
                                            onClick={() => setSelectedTotal({ field: f, value: true })}
                                        >
                                            <span className="text-xs font-bold opacity-60 group-hover:opacity-100">{f.toUpperCase()}</span>
                                            <span className="badge badge-primary badge-sm font-bold">
                                                {total}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedTotal && (
                <div className="card bg-base-100 shadow-xl border-2 border-primary p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary text-white rounded-lg">
                                <Eye size={20} />
                            </div>
                            <h3 className="text-xl font-black">Alumnos con {selectedTotal.field.toUpperCase()}</h3>
                        </div>
                        <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setSelectedTotal(null)}
                        >
                            Cerrar
                        </button>
                    </div>
                    <div className="divider my-0"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                        {getAlumnosForField(selectedTotal.field as keyof RAEAlumno).map(a => (
                            <div key={a.id} className="card bg-base-200 p-4 rounded-xl border border-base-300 hover:border-primary transition-colors">
                                <p className="font-bold text-sm">{a.alumno_nombre}</p>
                                <p className="text-xs opacity-50">{a.grado}</p>
                            </div>
                        ))}
                        {getAlumnosForField(selectedTotal.field as keyof RAEAlumno).length === 0 && (
                            <EmptyState icon={Users} title="No hay alumnos asignados a esta categoría." />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RAEValidationPanel;
