import { useState, useMemo } from 'react';
import { 
  Save, ArrowLeft, CheckCircle, XCircle, Search, AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { raeApi } from '../../api/rae';
import type { RAEAlumno } from '../../interfaces/rae';
import { ErrorState, EmptyState } from '../../components/Skeletons';
import { useLoading } from '../../context/LoadingContext';
import { useRAEDrafts } from '../../hooks/useRAEDrafts';
import { LoadingButton } from '../../components/LoadingButton';
import { SearchBar } from '../../components/SearchBar';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('TODOS');
    
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
        mutationFn: (payload: { registro_id: number, version: number, alumnos: RAEAlumno[] }) => raeApi.saveBulk(payload),
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rae_capture', id] });
            clearDrafts();
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Guardado!</span>, { description: 'La captura de RAE ha sido sincronizada con el servidor.' });
        },
        onError: (error: { response?: { status?: number } }) => {
            const isConflict = error?.response?.status === 409;
            if (isConflict) {
                toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Conflicto</span>, { description: 'Alguien más modificó los datos. Recargá la página y volvé a intentar.' });
            } else {
                toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'Hubo un problema al guardar los cambios.' });
            }
        },
        onSettled: () => hideLoading(),
    });

    const uniqueGrades = useMemo(() => {
        const grades = new Set((initData?.alumnos || []).map(a => a.grado));
        return ['TODOS', ...Array.from(grades).sort()];
    }, [initData]);

    const filteredAlumnos = useMemo(() => {
        let list = initData?.alumnos || [];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a => a.alumno_nombre?.toLowerCase().includes(q));
        }
        if (gradeFilter !== 'TODOS') {
            list = list.filter(a => a.grado === gradeFilter);
        }
        return list;
    }, [initData, searchQuery, gradeFilter]);

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
            version: initData?.version ?? 0,
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
            <div className="header-section header-primary">
                <div className="header-pattern" />
                <div className="header-circle header-circle-lg" />
                <div className="header-circle header-circle-sm" />
                <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            className="btn btn-circle btn-white btn-sm shadow-md hover:scale-110 transition-transform"
                            onClick={() => navigate('/rae')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                                Captura RAE: {initData?.escuela}
                            </h1>
                            <p className="text-sm md:text-base text-white/80 font-medium mt-2">
                                Ciclo: {initData?.ciclo} | {initData?.alumnos.length} Alumnos registrados
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                        <button 
                            className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-sm"
                            onClick={clearDrafts}
                            disabled={dirtyRows.size === 0}
                        >
                            Limpiar Borradores
                        </button>
                        <LoadingButton
                            className="btn btn-white btn-lg shadow-xl px-8 gap-2 hover:scale-105 transition-transform"
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

            <div className="card card-paper shadow-sm border border-base-300 p-6 space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-2xl border border-base-300 max-w-xl">
                        <AlertCircle size={18} className="text-primary shrink-0" />
                        <p className="text-xs text-base-content/70 font-medium italic leading-tight">
                            Instrucciones: Marque los cuadros correspondientes. Las filas resaltadas indican cambios pendientes de guardado.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <select 
                            className="select select-bordered select-sm font-bold"
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                        >
                            {uniqueGrades.map(g => (
                                <option key={g} value={g}>{g === 'TODOS' ? '🎯 Todos' : `${g}° Grado`}</option>
                            ))}
                        </select>
                        <div className="flex-1 lg:w-64">
                            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar alumno..." />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-2xl shadow-inner bg-base-100">
                    <table className="table table-zebra w-full border-collapse">
                        <thead>
                            <tr className="bg-base-200">
                                <th className="sticky left-0 bg-base-200 z-20 border-r w-64 text-left font-black text-base-content">Alumno</th>
                                {Object.entries(RAE_COLUMNS).map(([catKey, cat]) => (
                                    <th key={catKey} colSpan={cat.fields.length} className="text-center border-r bg-base-300 text-xs uppercase font-black opacity-70 tracking-widest">
                                        {cat.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-base-100">
                                <th className="sticky left-0 bg-base-100 z-20 border-r text-left text-xs font-bold opacity-50">Nombre Completo</th>
                                {Object.values(RAE_COLUMNS).flatMap(cat => 
                                    cat.fields.map(f => (
                                        <th key={f.id} className="text-center text-[10px] font-black w-12 border-r opacity-50 uppercase">
                                            {f.label}
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlumnos.length === 0 ? (
                                <tr><td colSpan={Object.values(RAE_COLUMNS).reduce((s, c) => s + c.fields.length, 0) + 1} className="text-center py-12"><EmptyState icon={Search} title="No se encontraron alumnos con ese nombre." /></td></tr>
                            ) : (filteredAlumnos.map((alum: RAEAlumno) => {
                                const isDirty = dirtyRows.has(alum.id);
                                return (
                                    <tr key={alum.id} className={isDirty ? 'bg-yellow-50/50' : ''}>
                                        <td className={`sticky left-0 z-10 border-r font-bold text-sm transition-colors ${isDirty ? 'bg-yellow-100' : 'bg-base-100'} flex items-center gap-2`}>
                                            {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-600" title="Cambios pendientes" aria-hidden="true" />}
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
                                                            className="checkbox checkbox-primary checkbox-sm hover:scale-110 transition-transform" 
                                                            checked={!!val} 
                                                            aria-label={`Marcar ${f.label} para ${alum.alumno_nombre}`}
                                                            onChange={(e) => updateField(alum.id, f.id, e.target.checked)}
                                                        />
                                                    </td>
                                                );
                                            })
                                        )}
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RAECaptureGrid;
