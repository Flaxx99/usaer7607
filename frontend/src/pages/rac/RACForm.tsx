import { useEffect, useState } from 'react';
import { 
  AlertCircle, ArrowLeft, Save, UserCheck, User 
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { racApi } from '../../api/rac';
import type { RegistroRAC } from '../../api/rac';
import { useLoading } from '../../context/LoadingContext';
import { getAlumnos } from '../../api/alumnos';

const CLASIFICACION_SUB = {
    'DISCAPACIDAD': [
        { value: 'DI', label: 'Discapacidad intelectual' },
        { value: 'DMO', label: 'Discapacidad motriz' },
        { value: 'SO', label: 'Sordera' },
        { value: 'HP', label: 'Hipoacusia' },
        { value: 'CEG', label: 'Ceguera' },
        { value: 'BV', label: 'Baja visión' },
        { value: 'DM', label: 'Discapacidad múltiple' },
        { value: 'SCG', label: 'Sordoceguera' },
        { value: 'DME', label: 'Discapacidad mental o psicosocial' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'DIFICULTADES_SEVERAS': [
        { value: 'DSC', label: 'Dificultades severas de conducta' },
        { value: 'DSCO', label: 'Dificultades severas de comunicación' },
        { value: 'DSA', label: 'Dificultades severas de aprendizaje' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'TRASTORNOS': [
        { value: 'TEA', label: 'Trastorno del espectro autista' },
        { value: 'TDAH', label: 'Trastorno por Déficit de Atención e Hiperactividad' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'APTITUDES_SOBRESALIENTES': [
        { value: 'ASI', label: 'Aptitudes sobresalientes intelectuales' },
        { value: 'ASC', label: 'Aptitudes sobresalientes creativas' },
        { value: 'ASS', label: 'Aptitudes sobresalientes socioafectivas' },
        { value: 'ASA', label: 'Aptitudes sobresalientes artísticas' },
        { value: 'ASP', label: 'Aptitudes sobresalientes psicomotrices' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
};

const CLASIFICACIONES = Object.keys(CLASIFICACION_SUB).map(k => ({ 
    value: k, 
    label: k.replace('_', ' ') 
}));

const RACForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    
    const [selectedAlumno, setSelectedAlumno] = useState<any>(null);

    const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
        queryKey: ['alumnos'],
        queryFn: () => getAlumnos(),
    });

    const { data: initialData, isLoading: loadingInitial } = useQuery({
        queryKey: ['rac_record', id],
        queryFn: async () => {
            const records = await racApi.getRecords();
            return records.results?.find((r: RegistroRAC) => r.id === Number(id));
        },
        enabled: !!id,
    });

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<Partial<RegistroRAC>>({
        defaultValues: {
            clasificacion: '',
            subclasificacion: '',
            observaciones: '',
        }
    });

    const currentClasificacion = watch('clasificacion');

    useEffect(() => {
        if (initialData) {
            reset(initialData);
            const alumno = alumnos?.results?.find(a => a.id === initialData.alumno);
            if (alumno) setSelectedAlumno(alumno);
        }
    }, [initialData, alumnos, reset]);

    useEffect(() => {
        setValue('subclasificacion', '');
    }, [currentClasificacion, setValue]);

    const saveMutation = useMutation({
        mutationFn: racApi.saveRecord,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rac_records'] });
            toast.success('¡Registro Guardado!', { description: 'La información del RAC ha sido actualizada correctamente.' });
            navigate('/rac');
        },
        onError: (err: any) => {
            toast.error('Error al Guardar', { description: err.response?.data?.detail || 'Ocurrió un error al procesar el registro.' });
        },
        onSettled: () => hideLoading(),
    });

    const onSubmit = (data: Partial<RegistroRAC>) => {
        if (!selectedAlumno) {
            toast.error('Alumno Requerido', { description: 'Debes seleccionar un alumno antes de guardar.' });
            return;
        }

        const payload = {
            ...data,
            id: id ? Number(id) : undefined,
            alumno: selectedAlumno.id,
        };

        saveMutation.mutate(payload);
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
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        className="btn btn-ghost btn-sm gap-2" 
                        onClick={() => navigate('/rac')}
                    >
                        <ArrowLeft size={18} />
                        Volver al Listado
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">
                        {id ? 'Editar Registro RAC' : 'Nuevo Registro RAC'}
                    </h1>
                </div>
                <button 
                    className="btn btn-primary px-8 gap-2" 
                    onClick={handleSubmit(onSubmit)}
                    disabled={saveMutation.isPending}
                >
                    {saveMutation.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <><Save size={18} /> Guardar Registro</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECCIÓN 1: INFORMACIÓN DEL ALUMNO */}
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-4 border-base-200">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Información del Alumno</h3>
                        </div>
                        
                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-bold">Seleccionar Alumno</span></label>
                            <select 
                                className="select select-bordered w-full"
                                value={selectedAlumno?.id ? String(selectedAlumno.id) : ''}
                                onChange={(e) => {
                                    const alumno = alumnos?.results?.find(a => String(a.id) === e.target.value);
                                    setSelectedAlumno(alumno || null);
                                }}
                                required
                            >
                                <option value="">Busca por nombre o CURP...</option>
                                {alumnos?.results?.map(a => (
                                    <option key={a.id} value={a.id}>{a.apellido_paterno} {a.apellido_materno}, {a.nombres}</option>
                                ))}
                            </select>
                        </div>

                        {selectedAlumno ? (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase opacity-50">CURP</span>
                                    <span className="font-bold text-sm">{selectedAlumno.curp || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase opacity-50">GÉNERO</span>
                                    <span className="font-bold text-sm">{selectedAlumno.sexo === 'H' ? 'Hombre' : selectedAlumno.sexo === 'M' ? 'Mujer' : 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase opacity-50">EDAD</span>
                                    <span className="font-bold text-sm">{selectedAlumno.edad} años</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase opacity-50">GRADO / GRUPO</span>
                                    <span className="font-bold text-sm">{selectedAlumno.grado} {selectedAlumno.grupo}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-warning shadow-sm py-3">
                                <AlertCircle size={18} />
                                <span className="text-xs font-medium">Selecciona un alumno para ver sus datos básicos.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 2: CLASIFICACIÓN TÉCNICA */}
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-4 border-base-200">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <UserCheck size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Clasificación Técnica</h3>
                        </div>

                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-bold">Clasificación</span></label>
                            <Controller
                                name="clasificacion"
                                control={control}
                                rules={{ required: "La clasificación es obligatoria" }}
                                render={({ field }) => (
                                    <select 
                                        {...field} 
                                        className={`select select-bordered w-full ${errors.clasificacion ? 'border-error' : ''}`}
                                        required
                                    >
                                        <option value="">Selecciona la categoría</option>
                                        {CLASIFICACIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                )}
                            />
                            {errors.clasificacion && <span className="text-error text-xs mt-1">{errors.clasificacion.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-bold">Subclasificación</span></label>
                            <Controller
                                name="subclasificacion"
                                control={control}
                                rules={{ required: "La subclasificación es obligatoria" }}
                                render={({ field }) => (
                                    <select 
                                        {...field} 
                                        className={`select select-bordered w-full ${errors.subclasificacion ? 'border-error' : ''}`}
                                        disabled={!currentClasificacion}
                                        required
                                    >
                                        <option value="">{currentClasificacion ? "Selecciona la sub-categoría" : "Primero elige una clasificación"}</option>
                                        {currentClasificacion ? (CLASIFICACION_SUB as any)[currentClasificacion].map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        )) : []}
                                    </select>
                                )}
                            />
                            {errors.subclasificacion && <span className="text-error text-xs mt-1">{errors.subclasificacion.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-bold">Observaciones</span></label>
                            <textarea 
                                {...register('observaciones')} 
                                className="textarea textarea-bordered h-32" 
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
