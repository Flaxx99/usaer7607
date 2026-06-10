import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, School, Edit2, Trash2, MapPin, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton } from '../../components/Skeletons';
import { getEscuelas, deleteEscuela, createEscuela, updateEscuela } from '../../api/escuelas';
import type { Escuela } from '../../interfaces/escuela';

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const NIVELES_OPCIONES = [
  { value: 'Primaria', label: '🏫 Primaria' },
  { value: 'Preescolar', label: '🧸 Preescolar' },
  { value: 'Secundaria', label: '🎓 Secundaria' },
  { value: 'Telesecundaria', label: '📡 Telesecundaria' },
];

const ListaEscuelas = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escuelaEditar, setEscuelaEditar] = useState<Escuela | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Escuela>();

  const { data: escuelas, isLoading, isError } = useQuery({
    queryKey: ['escuelas'],
    queryFn: () => getEscuelas(),
  });

  const createMutation = useMutation({
    mutationFn: createEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      toast.success('¡Creada! 🏫', { description: 'La escuela se registró correctamente en el sistema.' });
    },
    onError: (error: any) => {
      const mensaje = error.response?.data?.detail || 'Verifique los datos.';
      toast.error('Error al guardar ❌', { description: mensaje });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      toast.success('¡Actualizada! ✏️', { description: 'Los datos de la escuela han sido guardados.' });
    },
    onError: (error: any) => {
      const mensaje = error.response?.data?.detail || 'Verifique los datos.';
      toast.error('Error al guardar ❌', { description: mensaje });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      toast.success('¡Eliminada! 🗑️', { description: 'La escuela ha sido dada de baja del sistema.' });
    },
    onError: () => toast.error('Error ❌', { description: 'No se pudo eliminar (posiblemente tiene alumnos asignados).' })
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
    const datosParaFormulario = {
        ...escuela,
        nivel: toTitleCase(escuela.nivel)
    };
    reset(datosParaFormulario);
    setIsModalOpen(true);
  };

  const onSubmit = (data: Escuela) => {
    if (escuelaEditar) {
        updateMutation.mutate({ ...data, id: escuelaEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar escuela? Esta acción es irreversible.')) {
      deleteMutation.mutate(id);
    }
  };

  const escuelasFiltradas = escuelas?.filter(escuela => 
    escuela.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    escuela.clave_estatal.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    escuela.cct.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  if (isLoading) {
      return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <CardGridSkeleton cols={6} />
        </div>
      );
  }
  if (isError) return (
    <div className="flex items-center justify-center h-50vh p-4">
      <div className="alert alert-error shadow-lg max-w-md">
        <AlertTriangle className="w-6 h-6" />
        <span>Error al cargar datos del servidor.</span>
      </div>
    </div>
  );

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

        <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="p-4 border-b border-base-200">
                <div className="flex items-center gap-2 max-w-sm">
                    <Search size={18} className="text-base-content/40" />
                    <input type="text" placeholder="Nombre, CCT o Clave Estatal..." className="input input-bordered flex-1" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {escuelasFiltradas?.map((escuela) => (
                <div key={escuela.id} className="card bg-base-100 shadow-sm border border-base-300 transition-all hover:shadow-md group" style={{ borderLeft: '6px solid var(--color-primary)' }}>
                    <div className="card-body p-6">
                        <div className="flex items-start justify-between gap-2 mb-4">
                            <div className="badge badge-ghost font-mono text-xs font-bold">CCT: {escuela.cct}</div>
                            <div className={`badge badge-sm font-bold ${
                                escuela.nivel.includes('PRIMARIA') ? 'badge-primary' : 
                                escuela.nivel.includes('PREESCOLAR') ? 'badge-warning' : 'badge-success'
                            }`}>{toTitleCase(escuela.nivel)}</div>
                        </div>
                        <h3 className="text-lg font-bold text-base-content leading-tight mb-3">{escuela.nombre}</h3>
                        <div className="divider my-0"></div>
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-base-content/70">
                                <MapPin size={16} className="text-primary" />
                                <span className="font-medium">{escuela.domicilio}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-base-content/50">
                                <div className="w-4" />
                                <span>Col. {escuela.colonia} • Zona {escuela.zona}</span>
                            </div>
                        </div>
                        <div className="card-actions justify-end mt-6 pt-4 border-t border-base-200 gap-2">
                            <button className="btn btn-sm btn-outline btn-primary gap-1" onClick={() => handleOpenEdit(escuela)}><Edit2 size={14} /> Editar</button>
                            <button className="btn btn-sm btn-outline btn-error gap-1" onClick={() => handleDelete(escuela.id)}><Trash2 size={14} /> Eliminar</button>
                        </div>
                    </div>
                </div>
            ))}
            {escuelasFiltradas?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-base-200 rounded-box border-2 border-dashed border-base-300">
                  <School size={48} className="text-base-content/20 mb-4" />
                  <p className="font-medium text-base-content/50">No se encontraron escuelas.</p>
                </div>
            )}
            </div>
            </div>
        </div>

        {isModalOpen && (
            <div className="modal modal-open">
                <div className="modal-box max-w-2xl p-0 overflow-hidden">
                    <div className="bg-primary p-6 text-primary-content flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2"><School size={24} /> {escuelaEditar ? "Editar Escuela" : "Registrar Nueva Escuela"}</h3>
                        <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={cerrarModal}>✕</button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 form-control">
                            <label className="label"><span className="label-text font-bold">Nombre de la Escuela</span></label>
                            <input type="text" className="input input-bordered w-full" {...register('nombre', { required: "Obligatorio" })} />
                            {errors.nombre && <span className="text-error text-xs mt-1">{errors.nombre.message as string}</span>}
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">CCT</span></label>
                            <input type="text" className="input input-bordered w-full font-mono" {...register('cct', { required: "Obligatorio" })} />
                            {errors.cct && <span className="text-error text-xs mt-1">{errors.cct.message as string}</span>}
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Clave Estatal</span></label>
                            <input type="text" className="input input-bordered w-full" {...register('clave_estatal', { required: "Obligatorio" })} />
                            {errors.clave_estatal && <span className="text-error text-xs mt-1">{errors.clave_estatal.message as string}</span>}
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Nivel Educativo</span></label>
                            <select className="select select-bordered w-full" {...register('nivel', { required: "Obligatorio" })}>
                                <option value="">Selecciona el nivel</option>
                                {NIVELES_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            {errors.nivel && <span className="text-error text-xs mt-1">{errors.nivel.message as string}</span>}
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Zona Escolar</span></label>
                            <input type="text" className="input input-bordered w-full" {...register('zona', { required: "Obligatorio" })} />
                            {errors.zona && <span className="text-error text-xs mt-1">{errors.zona.message as string}</span>}
                        </div>
                        <div className="md:col-span-2 divider my-2">Ubicación Física</div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Domicilio Completo</span></label>
                            <input type="text" className="input input-bordered w-full" {...register('domicilio', { required: "Obligatorio" })} />
                            {errors.domicilio && <span className="text-error text-xs mt-1">{errors.domicilio.message as string}</span>}
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Colonia</span></label>
                            <input type="text" className="input input-bordered w-full" {...register('colonia', { required: "Obligatorio" })} />
                            {errors.colonia && <span className="text-error text-xs mt-1">{errors.colonia.message as string}</span>}
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-base-300">
                            <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                            <button type="submit" className="btn btn-primary gap-2"><Save size={18} /> {escuelaEditar ? 'Guardar Cambios' : 'Registrar Escuela'}</button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop" onClick={cerrarModal}></div>
            </div>
        )}
    </div>
  );
};

export default ListaEscuelas;
