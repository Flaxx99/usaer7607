import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { cicloSchema, type CicloFormData } from '../../schemas/ciclo';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Plus, Calendar, Edit2, Trash2, CheckCircle, AlertTriangle, Layers, ArrowRightCircle,
    GraduationCap, TrendingUp, Save, XCircle, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { 
    getCiclos, createCiclo, updateCiclo, deleteCiclo, 
    previewPromocion, ejecutarPromocion, getPromocionStatus
} from '../../api/ciclos';
import { TableSkeleton, ErrorState } from '../../components/Skeletons';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import { useLoading } from '../../context/LoadingContext';
import type { CicloEscolar } from '../../interfaces/ciclo';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

const ListaCiclos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cicloEditar, setCicloEditar] = useState<CicloEscolar | null>(null);
  const [isPromocionOpen, setIsPromocionOpen] = useState(false);
  const [promotionTaskId, setPromotionTaskId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  
  const queryClient = useQueryClient();
  const { showLoading, hideLoading } = useLoading();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CicloFormData>({
    resolver: zodResolver(cicloSchema),
    defaultValues: { activo: false },
  });

  const [fechaInicio, fechaFin] = watch(['fecha_inicio', 'fecha_fin']);
  const fechasInvalidas = !!(fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin));

  const { data: allCiclos = [], isLoading, isError, error } = useQuery({
    queryKey: ['ciclos'],
    queryFn: () => getCiclos(),
  });

  const busquedaLower = busqueda.toLowerCase();
  const filtered = busqueda
    ? allCiclos.filter(c => c.nombre.toLowerCase().includes(busquedaLower))
    : allCiclos;
  const ciclos = filtered;
  const totalCount = filtered.length;


  const { data: previewData, isLoading: loadingPreview, isError: errorPreview, refetch: refetchPreview } = useQuery({
    queryKey: ['promocionPreview'],
    queryFn: previewPromocion,
    enabled: isPromocionOpen,
    retry: false
  });

  const { data: promotionStatus } = useQuery({
    queryKey: ['promocionStatus', promotionTaskId],
    queryFn: () => getPromocionStatus(promotionTaskId!),
    enabled: !!promotionTaskId,
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 2000 : false),
  });

  const createMutation = useMutation({
    mutationFn: createCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Creado!</span>, { description: 'El ciclo escolar ha sido registrado.' });
    },
    onError: (err) => {
        const msg = isAxiosError(err) ? (err.response?.data as Record<string, unknown>)?.non_field_errors as string | undefined : undefined;
        toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: String(msg || 'Revisa las fechas.') });
    },
    onSettled: () => hideLoading()
  });

  const updateMutation = useMutation({
    mutationFn: updateCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      if (isModalOpen) toast.success(<span className="inline-flex items-center gap-1.5"><Pencil size={16} /> ¡Actualizado!</span>, { description: 'Datos actualizados.' });
    },
    onError: (err) => {
        const msg = isAxiosError(err) ? (err.response?.data as Record<string, unknown>)?.non_field_errors as string | undefined : undefined;
        toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: String(msg || 'No se pudo actualizar.') });
    },
    onSettled: () => hideLoading()
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminado!</span>, { description: 'El ciclo ha sido borrado.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se puede eliminar este ciclo.' }),
    onSettled: () => hideLoading()
  });

  const ejecutarPromocionMutation = useMutation({
    mutationFn: ejecutarPromocion,
    onMutate: () => showLoading(),
    onSuccess: (data) => {
        if (data.task_id) {
            setPromotionTaskId(data.task_id);
        } else {
            setIsPromocionOpen(false);
            setPromotionTaskId(null);
            queryClient.invalidateQueries({ queryKey: ['alumnos'] }); 
            toast.success(<span className="inline-flex items-center gap-1.5"><GraduationCap size={16} /> ¡Promoción Exitosa!</span>, { 
                description: `Promovidos: ${data.promovidos} | Graduados: ${data.graduados}` 
            });
        }
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'Hubo un problema al iniciar la promoción.' }),
    onSettled: () => hideLoading()
  });

  const handleConfirmarPromocion = () => {
    ejecutarPromocionMutation.mutate();
  };

  // The promotion status is polled from a background task. When it transitions
  // to COMPLETED/FAILED we close the modal and show feedback.
  // This is a legitimate synchronisation between an external polling system and UI state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (promotionStatus?.status === 'COMPLETED') {
        setIsPromocionOpen(false);
        setPromotionTaskId(null);
        queryClient.invalidateQueries({ queryKey: ['alumnos'] }); 
        toast.success(<span className="inline-flex items-center gap-1.5"><GraduationCap size={16} /> ¡Promoción Exitosa!</span>, { 
            description: `Promovidos: ${promotionStatus.data?.promovidos} | Graduados: ${promotionStatus.data?.graduados}` 
        });
    } else if (promotionStatus?.status === 'FAILED') {
        setIsPromocionOpen(false);
        setPromotionTaskId(null);
        toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: promotionStatus.error || 'La promoción falló durante el proceso.' });
    }
  }, [promotionStatus, queryClient]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cerrarModal = () => {
    setIsModalOpen(false);
    setCicloEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setCicloEditar(null);
    const year = new Date().getFullYear();
    reset({ nombre: `${year}-${year + 1}`, activo: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ciclo: CicloEscolar) => {
    setCicloEditar(ciclo);
    reset(ciclo);
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<CicloFormData> = (data) => {
    if (cicloEditar) {
        updateMutation.mutate({ ...data, id: cicloEditar.id } as CicloEscolar);
    } else {
        createMutation.mutate(data as CicloEscolar);
    }
  };

  const handleActivarCiclo = (ciclo: CicloEscolar) => {
    if (ciclo.activo) return;
    if (confirm(`¿Activar Ciclo ${ciclo.nombre}? Este pasará a ser el ciclo actual. El anterior se desactivará.`)) {
        updateMutation.mutate({ ...ciclo, activo: true });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar ciclo? Esta acción no se puede deshacer.')) {
        deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<CicloEscolar>[] = [
    {
        accessorKey: 'nombre',
        header: 'Ciclo Escolar',
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    row.original.activo ? 'bg-primary text-white' : 'bg-base-200 text-base-content/50'
                }`}>
                    <Calendar size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`font-black ${row.original.activo ? 'text-primary' : 'text-base-content'}`}>
                            {row.original.nombre}
                        </span>
                        {row.original.activo && (
                            <span className="badge badge-primary badge-xs font-bold">VIGENTE</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-60 font-mono mt-1">
                        <span>{row.original.fecha_inicio}</span>
                        <ArrowRightCircle size={12} />
                        <span>{row.original.fecha_fin}</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
            <div className="flex justify-center gap-2">
                {!row.original.activo && (
                    <button className="btn btn-outline btn-xs gap-1" onClick={() => handleActivarCiclo(row.original)}>
                        <CheckCircle size={14} /> Activar
                    </button>
                )}
                <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(row.original)}>
                    <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(row.original.id)}>
                    <Trash2 size={14} />
                </button>
            </div>
        )
    }
  ];


  if (isError) return <ErrorState error={error} message="Error al cargar los ciclos. Intenta de nuevo." />;

  if (isLoading) {
      return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <TableSkeleton rows={5} />
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
            <div className="card-body p-8 flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <Layers size={30} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Ciclos Escolares
                        </h1>
                        <p className="text-sm opacity-90 font-medium">
                            Define los periodos de trabajo y gestiona el ciclo vigente.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        className="btn btn-ghost bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        onClick={() => setIsPromocionOpen(true)}
                    >
                        <TrendingUp size={20} />
                        Promoción de Grado
                    </button>
                    <button 
                        className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                        onClick={handleOpenCreate}
                    >
                        <Plus size={22} />
                        Nuevo Ciclo
                    </button>
                </div>
            </div>
        </div>
        
        <DataTable 
            data={ciclos} 
            columns={columns} 
            isLoading={isLoading}
            totalCount={totalCount}
            page={page}
            onPageChange={setPage}
            onSearchChange={setBusqueda}
            searchValue={busqueda}
            placeholder="Buscar ciclo escolar..."
        />


        <Modal
            isOpen={isModalOpen}
            onClose={cerrarModal}
            title={cicloEditar ? "Editar Ciclo" : "Nuevo Ciclo Escolar"}
            icon={<Calendar size={24} />}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="form-control">
                    <label className="label" htmlFor="nombre"><span className="label-text font-bold">Nombre del Ciclo</span></label>
                    <input 
                        id="nombre"
                        {...register('nombre', { required: "El nombre es obligatorio" })} 
                        className="input input-bordered w-full font-mono uppercase" 
                        placeholder="Ej. 2024-2025" 
                    />
                    {errors.nombre && <span className="text-error text-xs mt-1">{errors.nombre.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label" htmlFor="fecha_inicio"><span className="label-text font-bold">Fecha Inicio</span></label>
                        <input 
                            id="fecha_inicio"
                            type="date" 
                            {...register('fecha_inicio', { required: "Obligatorio" })} 
                            className="input input-bordered w-full" 
                        />
                    </div>
                    <div className="form-control">
                        <label className="label" htmlFor="fecha_fin"><span className="label-text font-bold">Fecha Fin</span></label>
                        <input 
                            id="fecha_fin"
                            type="date" 
                            {...register('fecha_fin', { required: "Obligatorio" })} 
                            className="input input-bordered w-full" 
                        />
                    </div>
                </div>

                {fechasInvalidas && (
                    <div className="alert alert-error py-2 text-xs">
                        <AlertTriangle size={14} />
                        <span>La fecha de inicio debe ser anterior a la de fin.</span>
                    </div>
                )}

                {!cicloEditar && (
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-base-300">
                        <input type="checkbox" {...register('activo')} className="checkbox checkbox-primary" />
                        <span className="text-sm font-medium">Marcar como Ciclo Activo</span>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                    <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                    <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
                        <Save size={18} />
                        {cicloEditar ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </Modal>

        <Modal
            isOpen={isPromocionOpen}
            onClose={() => setIsPromocionOpen(false)}
            title="Simulación de Cierre de Ciclo"
            icon={<TrendingUp size={24} />}
            color="indigo"
            size="lg"
        >
            <div className="space-y-6">
                <div className="alert alert-info py-3 text-xs shadow-sm">
                    <div className="flex flex-col gap-1">
                        <p><strong>Promoción:</strong> Avanza de grado a los alumnos activos.</p>
                        <p><strong>Graduación:</strong> Da de baja a los que terminan nivel.</p>
                    </div>
                </div>

                {loadingPreview ? (
                    <div className="flex items-center justify-center py-12 flex-col gap-4">
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <p className="font-bold text-primary animate-pulse">Analizando alumnos...</p>
                    </div>
                ) : errorPreview ? (
                    <div className="alert alert-error py-4 text-center">
                        <p>Error al cargar la simulación.</p>
                        <button className="btn btn-ghost btn-xs" onClick={() => refetchPreview()}>Reintentar</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card bg-blue-50 p-6 text-center border border-blue-200">
                            <div className="flex justify-center mb-2 text-blue-600"><TrendingUp size={32} /></div>
                            <h4 className="text-3xl font-black text-blue-800">{previewData?.a_promover_count}</h4>
                            <p className="text-xs font-bold uppercase text-blue-600">Promovidos</p>
                        </div>
                        <div className="card bg-green-50 p-6 text-center border border-green-200">
                            <div className="flex justify-center mb-2 text-green-600"><GraduationCap size={32} /></div>
                            <h4 className="text-3xl font-black text-green-800">{previewData?.a_graduar_count}</h4>
                            <p className="text-xs font-bold uppercase text-green-600">Graduados</p>
                        </div>
                        <div className="card bg-base-200 p-6 text-center border border-base-300">
                            <div className="flex justify-center mb-2 text-base-content/40"><CheckCircle size={32} /></div>
                            <h4 className="text-3xl font-black text-base-content">{previewData?.total_activos}</h4>
                            <p className="text-xs font-bold uppercase text-base-content/60">Total Analizados</p>
                        </div>
                    </div>
                )}

                {promotionTaskId && (
                    <div className="card bg-primary text-white p-8 text-center space-y-4 animate-pulse">
                        <span className="loading loading-ring loading-lg mx-auto" />
                        <h4 className="text-xl font-black">Procesando Promoción...</h4>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-white h-full transition-all duration-500" 
                                style={{ width: `${promotionStatus?.progress || 0}%` }} 
                            />
                        </div>
                        <p className="text-xs font-medium">Estado: {promotionStatus?.status || 'Sincronizando...'}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-base-300">
                    <button className="btn btn-ghost" onClick={() => setIsPromocionOpen(false)}>Cancelar</button>
                    <LoadingButton
                        className="btn btn-error px-8 gap-2"
                        icon={TrendingUp}
                        loading={ejecutarPromocionMutation.isPending}
                        disabled={loadingPreview || !!errorPreview || ejecutarPromocionMutation.isPending || !!promotionTaskId}
                        onClick={handleConfirmarPromocion}
                    >
                        Ejecutar Cierre
                    </LoadingButton>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default ListaCiclos;
