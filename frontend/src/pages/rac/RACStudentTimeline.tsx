import { useState, useEffect } from 'react';
import {
    Clock, FileText, Plus, User, ArrowLeft,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { racApi } from '../../api/rac';
import { getAlumnos } from '../../api/alumnos';
import { PageSkeleton } from '../../components/Skeletons';
import { LoadingButton } from '../../components/LoadingButton';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../components/useConfirmDialog';
import type { RegistroRAC } from '../../interfaces/rac';
import type { Alumno } from '../../interfaces/alumno';

const CLASIFICACION_COLORS: Record<string, string> = {
    'DISCAPACIDAD': 'badge-info',
    'DIFICULTADES_SEVERAS': 'badge-warning',
    'TRASTORNOS': 'badge-error',
    'APTITUDES_SOBRESALIENTES': 'badge-secondary',
    'OTRO': 'badge-ghost',
};

const RACStudentTimeline = () => {
    const { alumnoId } = useParams<{ alumnoId: string }>();
    const navigate = useNavigate();
    const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDialog();

    const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);

    // Cargar datos del alumno
    const { data: alumnosData, isLoading: loadingAlumnos } = useQuery({
        queryKey: ['alumnos'],
        queryFn: () => getAlumnos(),
    });

    // Cargar historial RAC del alumno
    const { data: racRecords, isLoading: loadingRAC, refetch } = useQuery({
        queryKey: ['rac_student', alumnoId],
        queryFn: () => racApi.getByAlumno(Number(alumnoId)),
        enabled: !!alumnoId,
    });

    // Setear alumno seleccionado cuando carguen los datos
    useEffect(() => {
        if (alumnosData?.results && alumnoId) {
            const found = alumnosData.results.find((a: Alumno) => String(a.id) === alumnoId);
            if (found) setSelectedAlumno(found);
        }
    }, [alumnosData, alumnoId]);

    if (loadingAlumnos || loadingRAC) {
        return <PageSkeleton rows={5} />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* CABECERA */}
            <div className="card bg-indigo-600 text-white shadow-lg border-l-8 border-indigo-900">
                <div className="card-body p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="btn btn-ghost bg-white/10 hover:bg-white/20 text-white btn-sm"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <User size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">
                                    {selectedAlumno?.nombres} {selectedAlumno?.apellido_paterno} {selectedAlumno?.apellido_materno}
                                </h1>
                                <p className="text-sm opacity-90">
                                    CURP: <span className="font-mono font-bold">{selectedAlumno?.curp || 'N/A'}</span>
                                    {' | '}Grado: {selectedAlumno?.grado}° {selectedAlumno?.grupo}
                                </p>
                            </div>
                        </div>
                        <LoadingButton
                            className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                            icon={Plus}
                            onClick={() => navigate(`/rac/nuevo?alumno=${alumnoId}`)}
                        >
                            Nuevo RAC
                        </LoadingButton>
                    </div>
                </div>
            </div>

            {/* LÍNEA DE TIEMPO RAC */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-6">
                    <div className="flex items-center gap-2 border-b pb-4 border-base-200 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-bold">Historial de Registros RAC</h3>
                    </div>

                    {!racRecords || racRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-4">
                            <AlertCircle size={48} />
                            <p className="text-xl font-bold">Sin Registros RAC</p>
                            <p className="text-sm">Este alumno no tiene registros RAC en ningún ciclo escolar.</p>
                            <button
                                className="btn btn-primary mt-4"
                                onClick={() => navigate(`/rac/nuevo?alumno=${alumnoId}`)}
                            >
                                <Plus size={18} />
                                Crear Primer Registro RAC
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Timeline */}
                            <div className="relative">
                                {/* Línea vertical */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-base-300" />

                                {racRecords.map((record: RegistroRAC) => (
                                    <div key={record.id} className="relative flex items-start gap-6 pb-8 last:pb-0">
                                        {/* Círculo del timeline */}
                                        <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-md border-2 border-white">
                                            <FileText size={18} />
                                        </div>

                                        {/* Contenido de la tarjeta */}
                                        <div className="flex-1 card bg-base-200 border border-base-300 hover:shadow-md transition-shadow">
                                            <div className="card-body p-5">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm">{record.ciclo_escolar || 'Ciclo Actual'}</span>
                                                        <span className={`badge badge-sm ${CLASIFICACION_COLORS[record.clasificacion] || 'badge-ghost'}`}>
                                                            {record.clasificacion?.replace('_', ' ') || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-outline btn-xs btn-primary"
                                                            onClick={() => navigate(`/rac/editar/${record.id}`)}
                                                        >
                                                            <FileText size={14} />
                                                            Ver / Editar
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-xs font-bold uppercase opacity-50 block">Subclasificación</span>
                                                        <span>{record.subclasificacion}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold uppercase opacity-50 block">Maestro de Apoyo</span>
                                                        <span>{record.maestro_nombre || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold uppercase opacity-50 block">Escuela Regular</span>
                                                        <span>{record.escuela_nombre || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                {record.observaciones && (
                                                    <div className="mt-3 pt-3 border-t border-base-300">
                                                        <span className="text-xs font-bold uppercase opacity-50 block mb-1">Observaciones</span>
                                                        <p className="text-sm italic opacity-80">{record.observaciones}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RACStudentTimeline;
