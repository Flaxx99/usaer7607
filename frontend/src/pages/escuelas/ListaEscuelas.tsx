import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { escuelaSchema, type EscuelaFormData, NIVELES_OPCIONES } from '../../schemas/escuela';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, School, Edit2, Trash2, Save, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton, ErrorState } from '../../components/Skeletons';
import { getEscuelas, deleteEscuela, createEscuela, updateEscuela } from '../../api/escuelas';
import type { Escuela } from '../../interfaces/escuela';
import { DataTable } from '../../components/DataTable';
import { useConfirmDialog } from '../../components/useConfirmDialog';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import type { ColumnDef } from '@tanstack/react-table';


const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ListaEscuelas = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escuelaEditar, setEscuelaEditar] = useState<Escuela | null>(null);
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDialog();
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EscuelaFormData>({
    resolver: zodResolver(escuelaSchema),
  });

  const { data: allEscuelas = [], isLoading, isError } = useQuery({
    queryKey: ['escuelas'],
    queryFn: () => getEscuelas(1000, 1),
  });

  const busquedaLower = busquedaDebounced.toLowerCase();
  const escuelas = busquedaDebounced
    ? allEscuelas.filter(e => 
        e.nombre.toLowerCase().includes(busquedaLower) ||
        e.cct.toLowerCase().includes(busquedaLower) ||
        e.clave_estatal.toLowerCase().includes(busquedaLower)
      )
    : allEscuelas;
  const totalCount = escuelas.length;


  const createMutation = useMutation({
    mutationFn: createEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      toast.success(<span className="inline-flex items-center gap-1.5"><School size={16} /> ¡Creada!</span>, { description: 'La escuela se registró correctamente en el sistema.' });
    },
    onError: (error) => {
      const errorData = isAxiosError(error) ? error.response?.data as Record<string, unknown> | undefined : undefined;
      const mensaje = errorData?.detail as string | undefined || 'Verifique los datos.';
      toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: mensaje });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      toast.success(<span className="inline-flex items-center gap-1.5"><Pencil size={16} /> ¡Actualizada!</span>, { description: 'Los datos de la escuela han sido guardados.' });
    },
    onError: (error) => {
      const errorData = isAxiosError(error) ? error.response?.data as Record<string, unknown> | undefined : undefined;
      const mensaje = errorData?.detail as string | undefined || 'Verifique los datos.';
      toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: mensaje });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminada!</span>, { description: 'La escuela ha sido dada de baja del sistema.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo eliminar (posiblemente tiene alumnos asignados).' })
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEscuelaEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setEscuelaEditar(null);
    reset({
        nivel: 'Primaria',
        zona: '', clave_estatal: '', cct: '', nombre: '', domicilio: '', colonia: ''
    });
    setIsModalOpen(true);
  };


  const handleOpenEdit = (escuela: Escuela) => {
    setEscuelaEditar(escuela);
    reset({
        ...escuela,
        nivel: toTitleCase(escuela.nivel)
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: EscuelaFormData) => {
    if (escuelaEditar) {
        updateMutation.mutate({ ...data, id: escuelaEditar.id } as Escuela);
    } else {
        createMutation.mutate(data as Escuela);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDelete({
        title: 'Eliminar Escuela',
        message: '¿Eliminar escuela? Esta acción es irreversible.',
        variant: 'danger',
        confirmText: 'Eliminar',
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<Escuela>[] = [
    {
        accessorKey: 'nombre',
        header: 'Nombre de la Escuela',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <School size={16} className="text-primary" />
                <span className="font-bold">{row.original.nombre}</span>
            </div>
        )
    },
    {
        accessorKey: 'cct',
        header: 'CCT',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.cct}</span>
    },
    {
        accessorKey: 'nivel',
        header: 'Nivel',
        cell: ({ row }) => (
            <span className={`badge badge-sm font-bold ${
                row.original.nivel.toUpperCase().includes('PRIMARIA') ? 'badge-primary' : 
                row.original.nivel.toUpperCase().includes('PREESCOLAR') ? 'badge-warning' : 'badge-success'
            }`}>
                {toTitleCase(row.original.nivel)}
            </span>
        )
    },
    {
        accessorKey: 'zona',
        header: 'Zona',
        cell: ({ row }) => <span className="text-sm">{row.original.zona}</span>
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
            <div className="flex justify-center gap-2">
                <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(row.original)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(row.original.id)}><Trash2 size={14} /></button>
            </div>
        )
    }
  ];


  if (isLoading) {
      return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <CardGridSkeleton cols={6} />
        </div>
      );
  }
  if (isError) return <ErrorState message="Error al cargar las escuelas. Intenta de nuevo." />;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
            <div className="card-body p-8 flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <School size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Directorio de Escuelas</h1>
                        <p className="text-sm opacity-90 font-medium">Administra los centros de trabajo vinculados a la USAER 7607.</p>
                    </div>
                </div>
                <button className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform" onClick={handleOpenCreate}>
                    <Plus size={22} />
                    Registrar Nueva Escuela
                </button>
            </div>
        </div>
        
        <DataTable 
            data={escuelas} 
            columns={columns} 
            isLoading={isLoading}
            totalCount={totalCount}
            page={page}
            onPageChange={setPage}
            onSearchChange={setBusqueda}
            searchValue={busqueda}
            placeholder="Buscar por Nombre, CCT o Clave Estatal..."
        />


        <Modal
            isOpen={isModalOpen}
            onClose={cerrarModal}
            title={escuelaEditar ? "Editar Escuela" : "Registrar Nueva Escuela"}
            icon={<School size={24} />}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 form-control">
                    <label className="label" htmlFor="nombre"><span className="label-text font-bold">Nombre de la Escuela</span></label>
                    <input id="nombre" type="text" className="input input-bordered w-full" {...register('nombre', { required: "Obligatorio" })} />
                    {errors.nombre && <span className="text-error text-xs mt-1">{errors.nombre.message as string}</span>}
                </div>
                <div className="form-control">
                    <label className="label" htmlFor="cct"><span className="label-text font-bold">CCT</span></label>
                    <input id="cct" type="text" className="input input-bordered w-full font-mono" {...register('cct', { required: "Obligatorio" })} />
                    {errors.cct && <span className="text-error text-xs mt-1">{errors.cct.message as string}</span>}
                </div>
                <div className="form-control">
                    <label className="label" htmlFor="clave_estatal"><span className="label-text font-bold">Clave Estatal</span></label>
                    <input id="clave_estatal" type="text" className="input input-bordered w-full" {...register('clave_estatal', { required: "Obligatorio" })} />
                    {errors.clave_estatal && <span className="text-error text-xs mt-1">{errors.clave_estatal.message as string}</span>}
                </div>
                <div className="form-control">
                    <label className="label" htmlFor="nivel"><span className="label-text font-bold">Nivel Educativo</span></label>
                    <select id="nivel" className="select select-bordered w-full" {...register('nivel', { required: "Obligatorio" })}>
                        <option value="">Selecciona el nivel</option>
                        {NIVELES_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {errors.nivel && <span className="text-error text-xs mt-1">{errors.nivel.message as string}</span>}
                </div>
                <div className="form-control">
                    <label className="label" htmlFor="zona"><span className="label-text font-bold">Zona Escolar</span></label>
                    <input id="zona" type="text" className="input input-bordered w-full" {...register('zona', { required: "Obligatorio" })} />
                    {errors.zona && <span className="text-error text-xs mt-1">{errors.zona.message as string}</span>}
                </div>
                <div className="md:col-span-2 divider my-2">Ubicación Física</div>
                <div className="form-control">
                    <label className="label" htmlFor="domicilio"><span className="label-text font-bold">Domicilio Completo</span></label>
                    <input id="domicilio" type="text" className="input input-bordered w-full" {...register('domicilio', { required: "Obligatorio" })} />
                    {errors.domicilio && <span className="text-error text-xs mt-1">{errors.domicilio.message as string}</span>}
                </div>
                <div className="form-control">
                    <label className="label" htmlFor="colonia"><span className="label-text font-bold">Colonia</span></label>
                    <input id="colonia" type="text" className="input input-bordered w-full" {...register('colonia', { required: "Obligatorio" })} />
                    {errors.colonia && <span className="text-error text-xs mt-1">{errors.colonia.message as string}</span>}
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-base-300">
                    <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                    <LoadingButton type="submit" className="btn btn-primary gap-2" icon={Save} loading={createMutation.isPending || updateMutation.isPending}>
                        {escuelaEditar ? 'Guardar Cambios' : 'Registrar Escuela'}
                    </LoadingButton>
                </div>
            </form>
        </Modal>
        {confirmDialog}
    </div>
  );
};

export default ListaEscuelas;
