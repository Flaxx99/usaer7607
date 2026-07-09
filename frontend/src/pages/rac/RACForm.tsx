import { useEffect, useState } from 'react';
import { 
  AlertCircle, ArrowLeft, Save, UserCheck, User,
  CheckCircle, XCircle
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { racSchema, CLASIFICACION_SUB, CLASIFICACIONES, type RACFormData } from '../../schemas/rac';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { getRACRecords, saveRACRecord } from '../../api/rac';
import { LoadingButton } from '../../components/LoadingButton';
import type { RegistroRAC } from '../../interfaces/rac';
import { useLoading } from '../../context/LoadingContext';
import { getAlumnos } from '../../api/alumnos';
import type { Alumno } from '../../interfaces/alumno';

interface SubclasificacionOption {
    value: string;
    label: string;
}

const RACForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    
    const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);

    // Pre-seleccionar alumno desde query param (si viene de la timeline)
    const searchParams = new URLSearchParams(window.location.search);
    const alumnoFromUrl = searchParams.get('alumno');

    const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
        queryKey: ['alumnos'],
        queryFn: () => getAlumnos(),
    });

    const { data: initialData, isLoading: loadingInitial } = useQuery({
        queryKey: ['rac_record', id],
        queryFn: async () => {
            const records = await getRACRecords();
            return records.results?.find((r: RegistroRAC) => r.id === Number(id));
        },
        enabled: !!id,
    });

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<RACFormData>({
        resolver: zodResolver(racSchema),
        defaultValues: {
            clasificacion: '',
            subclasificacion: '',
            observaciones: '',
        }
    });

    const currentClasificacion = watch('clasificacion');

    useEffect(() => {
        if (initialData) {
            reset({
                clasificacion: initialData.clasificacion,
                subclasificacion: initialData.subclasificacion,
                observaciones: initialData.observaciones,
            });
            const alumno = alumnos?.results?.find(a => a.id === initialData.alumno);
            if (alumno) setSelectedAlumno(alumno);
        }
    }, [initialData, alumnos, reset]);

    // Auto-seleccionar alumno desde query param
    useEffect(() => {
        if (alumnoFromUrl && alumnos?.results && !id) {
            const alumno = alumnos?.results?.find(a => String(a.id) === alumnoFromUrl);
            if (alumno) setSelectedAlumno(alumno);
        }
    }, [alumnoFromUrl, alumnos, id]);

    useEffect(() => {
        setValue('subclasificacion', '');
    }, [currentClasificacion, setValue]);

    const saveMutation = useMutation({
        mutationFn: saveRACRecord,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rac_records'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Guardado!</span>, { description: 'La información del RAC ha sido actualizada correctamente.' });
            navigate('/rac');
        },
        onError: (err) => {
            const errorData = isAxiosError(err) ? err.response?.data as Record<string, unknown> | undefined : undefined;
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: (errorData?.detail as string) || 'Ocurrió un error al procesar el registro.' });
        },
        onSettled: () => hideLoading(),
    });

    const onSubmit = (data: RACFormData) => {
        if (!selectedAlumno) {
            toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'Debes seleccionar un alumno antes de guardar.' });
            return;
        }

        const payload = {
            ...data,
            id: id ? Number(id) : undefined,
            alumno: selectedAlumno.id,
        };

        saveMutation.mutate(payload as Partial<RegistroRAC>);
    };

    if (loadingAlumnos || loadingInitial) {
        return (
            <div className="flex items-center justify-center h-[70vh] flex-col gap-4">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="font-bold text-primary animate-pulse">Cargando datos del sistema...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* Header Section - Playful Paper Style */}
            <div className="header-section header-documentos">
                <div className="header-pattern" />
                <div className="header-circle header-circle-lg" />
                <div className="header-circle header-circle-sm" />
                <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            className="btn btn-circle btn-white btn-sm shadow-md hover:scale-110 transition-transform" 
                            onClick={() => navigate('/rac')}
                            aria-label="Volver al listado"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                                {id ? 'Editar Registro RAC' : 'Nuevo Registro RAC'}
                            </h1>
                            <p className="text-sm md:text-base text-white/80 font-medium mt-2">
                                Capturá el Reporte de Alumnos con Condiciones Específicas
                            </p>
                        </div>
                    </div>
                    <LoadingButton
                        className="btn btn-white btn-lg shadow-xl px-8 gap-2 hover:scale-105 transition-transform"
                        icon={Save}
                        loading={saveMutation.isPending}
                        onClick={handleSubmit(onSubmit)}
                    >
                        Guardar Registro
                    </LoadingButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECCIÓN 1: INFORMACIÓN DEL ALUMNO */}
                <div className="card card-paper shadow-sm border border-base-300">
                    <div className="card-body p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4 border-base-200">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-base-content">Información del Alumno</h3>
                                <p className="text-xs text-base-content/50">Datos generales del estudiante</p>
                            </div>
                        </div>
                        
                        <div className="form-control w-full">
                            <label className="label" htmlFor="alumno_id"><span className="label-text font-bold">Seleccionar Alumno</span></label>
                            <select 
                                id="alumno_id"
                                className="select select-bordered w-full focus:border-primary transition-colors"
                                value={selectedAlumno?.id ? String(selectedAlumno.id) : ''}
                                onChange={(e) => {
                                    const alumno = alumnos?.results?.find(a => String(a.id) === e.target.value);
                                    setSelectedAlumno(alumno || null);
                                }}
                                required
                            >
                                <option value="">Busca por nombre o CURP...</option>
                                {alumnos?.results?.map(a => <option key={a.id} value={a.id}>{a.apellido_paterno}{a.apellido_materno ? ` ${a.apellido_materno}` : ''}, {a.nombres}</option>)}
                            </select>
                        </div>

                        {selectedAlumno ? (
                            <div className="grid grid-cols-2 gap-4 p-5 bg-base-200 rounded-2xl border border-base-300">
                                <div className="flex flex-col p-2">
                                    <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">CURP</span>
                                    <span className="font-bold text-sm">{selectedAlumno.curp || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col p-2">
                                    <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">GÉNERO</span>
                                    <span className="font-bold text-sm">{selectedAlumno.sexo === 'H' ? 'Hombre' : selectedAlumno.sexo === 'M' ? 'Mujer' : 'N/A'}</span>
                                </div>
                                <div className="flex flex-col p-2">
                                    <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">EDAD</span>
                                    <span className="font-bold text-sm">{selectedAlumno?.edad ?? 'N/A'} años</span>
                                </div>
                                <div className="flex flex-col p-2">
                                    <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">GRADO / GRUPO</span>
                                    <span className="font-bold text-sm">{selectedAlumno.grado}° {selectedAlumno.grupo || '—'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-warning shadow-sm py-3 rounded-2xl">
                                <AlertCircle size={18} />
                                <span className="text-xs font-medium">Selecciona un alumno para ver sus datos básicos.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 2: CLASIFICACIÓN TÉCNICA */}
                <div className="card card-paper shadow-sm border border-base-300">
                    <div className="card-body p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4 border-base-200">
                            <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-base-content">Clasificación Técnica</h3>
                                <p className="text-xs text-base-content/50">Categoría y subcategoría de la condición</p>
                            </div>
                        </div>

                        <div className="form-control w-full">
                            <label className="label" htmlFor="clasificacion"><span className="label-text font-bold">Clasificación</span></label>
                            <Controller
                                name="clasificacion"
                                control={control}
                                render={({ field }) => (
                                    <select 
                                        id="clasificacion"
                                        {...field} 
                                        className={`select select-bordered w-full focus:border-primary transition-colors ${errors.clasificacion ? 'border-error' : ''}`}
                                    >
                                        <option value="">Selecciona la categoría</option>
                                        {CLASIFICACIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                )}
                            />
                            {errors.clasificacion && <span className="text-error text-xs mt-1">{errors.clasificacion.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label" htmlFor="subclasificacion"><span className="label-text font-bold">Subclasificación</span></label>
                            <Controller
                                name="subclasificacion"
                                control={control}
                                render={({ field }) => (
                                    <select 
                                        id="subclasificacion"
                                        {...field} 
                                        className={`select select-bordered w-full focus:border-primary transition-colors ${errors.subclasificacion ? 'border-error' : ''}`}
                                        disabled={!currentClasificacion}
                                    >
                                        <option value="">{currentClasificacion ? "Selecciona la sub-categoría" : "Primero elige una clasificación"}</option>
                                        {currentClasificacion ? (CLASIFICACION_SUB[currentClasificacion] ?? []).map((opt: SubclasificacionOption) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        )) : []}
                                    </select>
                                )}
                            />
                            {errors.subclasificacion && <span className="text-error text-xs mt-1">{errors.subclasificacion.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label" htmlFor="observaciones"><span className="label-text font-bold">Observaciones</span></label>
                            <textarea 
                                id="observaciones"
                                {...register('observaciones')} 
                                className="textarea textarea-bordered h-32 focus:border-primary transition-colors" 
                                placeholder="Notas adicionales sobre la condición del alumno..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default RACForm;
