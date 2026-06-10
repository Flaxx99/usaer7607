
import { 
  Save, ArrowLeft, CheckCircle, XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { raeApi } from '../../api/rae';
import type { RAEAlumno } from '../../api/rae';
import { ErrorState } from '../../components/Skeletons';
import { useLoading } from '../../context/LoadingContext';
import { useRAEDrafts } from '../../hooks/useRAEDrafts';
import { LoadingButton } from '../../components/LoadingButton';

const RAE_COLUMNS = {
    condiciones: {
        label: 'Condiciones',
        fields: [
            { id: 'ceg', label: 'CEG' }, { id: 'bv', label: 'BV' }, { id: 'so', label: 'SO' },
            { id: 'hp', label: 'HP' }, { id: 'scg', label: 'SCG' }, { id: 'dmo', label: 'DMO' },
            { id: 'di', label: 'DI' }, { id: 'dme', label: 'DME' }, { id: 'psicosocial', label: 'PSICO' },
            { id: 'dm', label: 'DM' },
        ]
    },
    dificultades: {
        label: 'Dificultades',
        fields: [
            { id: 'dsc', label: 'DSC' }, { id: 'dsco', label: 'DSCO' }, { id: 'dsa', label: 'DSA' },
        ]
    },
    especiales: {
        label: 'Sobr.',
        fields: [
            { id: 'asi', label: 'ASI' }, { id: 'asc', label: 'ASC' }, { id: 'ass', label: 'ASS' },
            { id: 'asa', label: 'ASA' }, { id: 'asp', label: 'ASP' }, { id: 'ot', label: 'OT' },
        ]
    },
    apoyos: {
        label: 'Apoyos',
        fields: [
            { id: 'psicologia', label: 'PSIC' }, { id: 'comunicacion', label: 'COM' }, 
            { id: 'psicomotricidad', label: 'PSICOM' }, { id: 'trabajo_social', label: 'T.SOC' }, 
            { id: 'aprendizaje', label: 'APR' },
        ]
    },
    estatus: {
        label: 'Estatus',
        fields: [
            { id: 'nuevo_ingreso', label: 'NI' }, { id: 'subsecuente', label: 'SUB' },
        ]
    },
    portafolio: {
        label: 'Portafolio',
        fields: [
            { id: 'diagnostico', label: 'DIAG' }, { id: 'educativo', label: 'EDU' }, 
            { id: 'deteccion', label: 'DET' }, { id: 'psicopedagogico', label: 'PSICOP' }, 
            { id: 'plan', label: 'PLAN' }, { id: 'modelo', label: 'MOD' },
        ]
    }
};

const RAECaptureGrid = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    
    const { 
        drafts, 
        dirtyRows, 
        updateField, 
        clearDrafts, 
        getFieldValue 
    } = useRAEDrafts(id || '');

    const { data: initData, isLoading, isError, error } = useQuery({
        queryKey: ['rae_capture', id],
        queryFn: raeApi.initCapture,
        enabled: !!id,
    });

    const saveMutation = useMutation({
        mutationFn: (payload: { registro_id: number, alumnos: RAEAlumno[] }) => raeApi.saveBulk(payload),
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rae_capture', id] });
            clearDrafts();
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Guardado!</span>, { description: 'La captura de RAE ha sido sincronizada con el servidor.' });
        },
        onError: () => {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'Hubo un problema al guardar los cambios.' });
        },
        onSettled: () => hideLoading(),
    });

    const handleSave = () => {
        const updates = Object.entries(drafts).map(([alumId, changes]) => ({
            id: Number(alumId),
            ...changes
        }));

        if (updates.length === 0) {
            toast.info('Sin cambios', { description: 'No hay datos nuevos para guardar.' });
            return;
        }

        saveMutation.mutate({
            registro_id: Number(id),
            alumnos: updates
        });
    };

    if (isError) return <ErrorState error={error} message="Error al cargar la captura RAE. Intenta de nuevo." />;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh] flex-col gap-4">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="font-bold text-primary animate-pulse">Cargando cuadrícula de captura...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
                <div className="card-body p-8 flex-row items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <button 
                            className="btn btn-ghost btn-sm gap-2" 
                            onClick={() => navigate('/rae')}
                        >
                            <ArrowLeft size={18} />
                            Volver
                        </button>
                        <div className="ml-4">
                            <h1 className="text-2xl font-black tracking-tight">
                                Captura RAE: {initData?.escuela}
                            </h1>
                            <p className="text-sm opacity-90 font-medium">
                                Ciclo: {initData?.ciclo} | {initData?.alumnos.length} Alumnos
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            onClick={clearDrafts}
                            disabled={dirtyRows.size === 0}
                        >
                            Limpiar Borradores
                        </button>
                        <LoadingButton
                            className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                            icon={Save}
                            loading={saveMutation.isPending}
                            disabled={saveMutation.isPending || dirtyRows.size === 0}
                            onClick={handleSave}
                        >
                            Guardar Cambios ({dirtyRows.size})
                        </LoadingButton>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300 p-6">
                <p className="text-xs text-base-content/50 font-medium italic mb-4">
                    Instrucciones: Marque los cuadros correspondientes. Las filas resaltadas en amarillo indican cambios pendientes de guardado.
                </p>

                <div className="overflow-x-auto border rounded-xl">
                    <table className="table table-zebra w-full border-collapse">
                        <thead>
                            <tr className="bg-base-200">
                                <th className="sticky left-0 bg-base-200 z-20 border-r w-64 text-left">Alumno</th>
                                {Object.entries(RAE_COLUMNS).map(([catKey, cat]) => (
                                    <th key={catKey} colSpan={cat.fields.length} className="text-center border-r bg-base-300 text-xs uppercase opacity-70">
                                        {cat.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-base-100">
                                <th className="sticky left-0 bg-base-100 z-20 border-r text-left text-xs font-bold">Nombre Completo</th>
                                {Object.values(RAE_COLUMNS).flatMap(cat => 
                                    cat.fields.map(f => (
                                        <th key={f.id} className="text-center text-xs font-bold w-12 border-r">
                                            {f.label}
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {initData?.alumnos.map((alum: RAEAlumno) => {
                                const isDirty = dirtyRows.has(alum.id);
                                return (
                                    <tr key={alum.id} className={isDirty ? 'bg-yellow-50' : ''}>
                                        <td className={`sticky left-0 z-10 border-r font-bold text-sm ${isDirty ? 'bg-yellow-100' : 'bg-base-100'}`}>
                                            {alum.alumno_nombre}
                                        </td>
                                        {Object.values(RAE_COLUMNS).flatMap(cat => 
                                            cat.fields.map(f => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const val = getFieldValue(alum.id, f.id, (alum as any)[f.id]);
                                                return (
                                                    <td key={f.id} className="text-center border-r">
                                                        <input 
                                                            type="checkbox" 
                                                            className="checkbox checkbox-primary checkbox-sm" 
                                                            checked={!!val} 
                                                            onChange={(e) => updateField(alum.id, f.id, e.target.checked)}
                                                        />
                                                    </td>
                                                );
                                            })
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RAECaptureGrid;
