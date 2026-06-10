import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { avisoFormSchema, type AvisoForm } from '../../schemas/aviso';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Megaphone, Plus, Calendar, Edit2, Trash2, 
    AlertCircle, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton, EmptyState, ErrorState } from '../../components/Skeletons';
import Modal from '../../components/Modal';
import { getAvisos, createAviso, updateAviso, deleteAviso } from '../../api/avisos';
import type { Anuncio } from '../../interfaces/aviso';

const TablonAvisos = () => {
  const [verMisAvisos, setVerMisAvisos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avisoEditar, setAvisoEditar] = useState<Anuncio | null>(null);

  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AvisoForm>({
    resolver: zodResolver(avisoFormSchema),
  });

  const { data: avisos, isLoading, isError, error } = useQuery({
    queryKey: ['avisos', verMisAvisos],
    queryFn: () => getAvisos(verMisAvisos),
  });

  const createMutation = useMutation({
    mutationFn: createAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      toast.success('¡Publicado! 📢', { description: 'El aviso ha sido creado y se enviarán notificaciones al personal.' });
    },
    onError: (err) => {
        const errorData = isAxiosError(err) ? err.response?.data as Record<string, unknown> | undefined : undefined;
        const msg = errorData?.fecha_expiracion as string | undefined || 'Revisa los datos.';
        toast.error('Error ❌', { description: msg });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      toast.success('¡Actualizado! ✏️', { description: 'Aviso modificado correctamente.' });
    },
    onError: () => toast.error('Error ❌', { description: 'No se pudo actualizar.' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      toast.success('¡Eliminado! 🗑️', { description: 'Aviso borrado del tablón.' });
    }
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setAvisoEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setAvisoEditar(null);
    const now = new Date().toISOString().slice(0, 16); 
    reset({ 
        fecha_publicacion: now,
        titulo: '',
        contenido: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (aviso: Anuncio) => {
    setAvisoEditar(aviso);
    const formatForInput = (isoString: string) => isoString ? isoString.slice(0, 16) : '';
    
    reset({
        ...aviso,
        fecha_publicacion: formatForInput(aviso.fecha_publicacion),
        fecha_expiracion: aviso.fecha_expiracion ? formatForInput(aviso.fecha_expiracion) : null
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: AvisoForm) => {
    const envio = { ...data };
    if (!envio.fecha_expiracion || String(envio.fecha_expiracion).trim() === '') {
        envio.fecha_expiracion = null;
    }
    if (envio.fecha_publicacion && envio.fecha_publicacion.length === 16) {
        envio.fecha_publicacion = `${envio.fecha_publicacion}:00`;
    }
    if (envio.fecha_expiracion && envio.fecha_expiracion.length === 16) {
        envio.fecha_expiracion = `${envio.fecha_expiracion}:00`;
    }
    if (avisoEditar) {
        updateMutation.mutate({ ...envio, id: avisoEditar.id } as Anuncio);
    } else {
        createMutation.mutate(envio as Anuncio);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar aviso? Desaparecerá del tablón permanentemente.')) {
        deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
        return format(new Date(dateStr), "d 'de' MMMM, h:mm a", { locale: es });
    } catch { return dateStr; }
  };

  const avisosFiltrados = useMemo(() => {
    if (!avisos) return [];
    return avisos.filter(aviso => {
      const cumpleBusqueda = 
        aviso.titulo.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
        aviso.contenido.toLowerCase().includes(busquedaDebounced.toLowerCase());
      return cumpleBusqueda;
    });
  }, [avisos, busquedaDebounced]);

  if (isError) return <ErrorState error={error} message="Error al cargar los avisos. Intenta de nuevo." />;

  if (isLoading) {
      return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <CardGridSkeleton cols={6} />
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* CABECERA */}
        <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
            <div className="card-body p-8 flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <Megaphone size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Tablón de Avisos Oficial
                        </h1>
                        <p className="text-sm opacity-90 font-medium">
                            Comunicados, circulares y anuncios importantes para todo el personal de la USAER 7607.
                        </p>
                    </div>
                </div>
                
                <button 
                    className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                    onClick={handleOpenCreate}
                >
                    <Plus size={22} />
                    Publicar Nuevo Aviso
                </button>
            </div>
        </div>

        {/* FILTROS */}
        <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-6">
            <div className="flex items-center gap-2 text-base-content/60">
                <Filter size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Filtrar Tablón</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="form-control w-full">
                    <label className="label" htmlFor="buscar_aviso"><span className="label-text font-bold">Buscar Aviso</span></label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                        <input 
                            id="buscar_aviso"
                            type="text" 
                            placeholder="Escribe el título o contenido..." 
                            className="input input-bordered pl-10 w-full" 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-bold">Vista del Tablón</span></label>
                    <div className="join w-full">
                        <button 
                            className={`btn btn-sm join-item ${!verMisAvisos ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setVerMisAvisos(false)}
                        >📢 Tablón General</button>
                        <button 
                            className={`btn btn-sm join-item ${verMisAvisos ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setVerMisAvisos(true)}
                        >✏️ Mis Publicaciones</button>
                    </div>
                </div>
            </div>
        </div>

        {/* REJILLA DE AVISOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avisosFiltrados?.map((aviso) => {
                const isExpired = !aviso.es_activo && aviso.fecha_expiracion;
                const isScheduled = new Date(aviso.fecha_publicacion) > new Date();

                return (
                    <div 
                        key={aviso.id} 
                        className={`card bg-base-100 shadow-sm border-t-4 transition-all hover:shadow-md group ${
                            isExpired ? 'border-t-base-300 opacity-70' : 
                            isScheduled ? 'border-t-warning' : 'border-t-primary'
                        }`}
                    >
                        <div className="card-body p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-tighter">
                                    <Calendar size={14} className="text-primary" />
                                    {formatDate(aviso.fecha_publicacion)}
                                </div>
                                <span className={`badge badge-sm font-bold ${
                                    isExpired ? 'badge-ghost' : 
                                    isScheduled ? 'badge-warning' : 'badge-primary'
                                }`}>
                                    {isExpired ? 'Expirado' : isScheduled ? 'Programado' : 'Activo'}
                                </span>
                            </div>

                            <h3 className="text-xl font-black leading-tight text-base-content group-hover:text-primary transition-colors">
                                {aviso.titulo}
                            </h3>

                            <div className="divider my-0" />

                            <p className="text-sm text-base-content/70 leading-relaxed min-h-[80px]">
                                {aviso.contenido}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-base-200">
                                <div className="flex items-center gap-2">
                                    <div className="avatar placeholder">
                                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 text-xs font-bold">
                                            {aviso.autor_nombre.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{aviso.autor_nombre}</span>
                                        <span className="text-xs opacity-50">Autor</span>
                                    </div>
                                </div>

                                {verMisAvisos && (
                                    <div className="flex gap-1">
                                        <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(aviso)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(aviso.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {avisos?.length === 0 && (
                <EmptyState icon={Megaphone} title="No hay avisos publicados en esta sección." />
            )}
        </div>

        <Modal
            isOpen={isModalOpen}
            onClose={cerrarModal}
            title={avisoEditar ? "Editar Comunicado" : "Nuevo Comunicado Oficial"}
            icon={<Megaphone size={24} />}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="form-control">
                    <label className="label" htmlFor="titulo"><span className="label-text font-bold">Título del Aviso</span></label>
                    <input 
                        id="titulo"
                        {...register('titulo')} 
                        className="input input-bordered w-full" 
                        placeholder="Ej. Suspensión de labores, Junta de Consejo..." 
                    />
                    {errors.titulo && <span className="text-error text-xs mt-1">{errors.titulo.message}</span>}
                </div>

                <div className="form-control">
                    <label className="label" htmlFor="contenido"><span className="label-text font-bold">Contenido del Comunicado</span></label>
                    <textarea 
                        id="contenido"
                        {...register('contenido')} 
                        className="textarea textarea-bordered h-32" 
                        placeholder="Detalle la información relevante..." 
                    />
                    {errors.contenido && <span className="text-error text-xs mt-1">{errors.contenido.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label" htmlFor="fecha_publicacion"><span className="label-text font-bold">Fecha de Publicación</span></label>
                        <Controller
                            name="fecha_publicacion"
                            control={control}
                            render={({ field }) => (
                                <input 
                                    id="fecha_publicacion"
                                    type="datetime-local" 
                                    {...field} 
                                    className="input input-bordered w-full" 
                                />
                            )}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label" htmlFor="fecha_expiracion"><span className="label-text font-bold">Fecha de Expiración (Opcional)</span></label>
                        <Controller
                            name="fecha_expiracion"
                            control={control}
                            render={({ field }) => (
                                <input 
                                    id="fecha_expiracion"
                                    type="datetime-local" 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    className="input input-bordered w-full" 
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-3">
                    <AlertCircle size={18} className="text-primary mt-1" />
                    <p className="text-xs text-primary-content/80">
                        Al publicar, se enviará una notificación automática a todos los usuarios activos del sistema.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                    <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                    <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
                        <Megaphone size={18} />
                        {avisoEditar ? 'Actualizar Aviso' : 'Publicar Comunicado'}
                    </button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default TablonAvisos;
