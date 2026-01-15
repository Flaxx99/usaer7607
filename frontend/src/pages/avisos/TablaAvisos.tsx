import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Megaphone, Plus, Calendar, Edit2, Trash2, Clock, 
    AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// API
import { getAvisos, createAviso, updateAviso, deleteAviso } from '../../api/avisos';
import type { Anuncio } from '../../interfaces/aviso';

import Modal from '../../components/Modal';

const TablonAvisos = () => {
  // Estado: false = Tablón Público, true = Mis Avisos (Gestión)
  const [verMisAvisos, setVerMisAvisos] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avisoEditar, setAvisoEditar] = useState<Anuncio | null>(null);

  const queryClient = useQueryClient();
  // CORRECCIÓN: Quitamos 'watch' y 'errors' que no se usaban
  const { register, handleSubmit, reset } = useForm<Anuncio>();

  // --- QUERY ---
  const { data: avisos, isLoading } = useQuery({
    queryKey: ['avisos', verMisAvisos],
    queryFn: () => getAvisos(verMisAvisos),
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      Swal.fire('Publicado', 'El aviso ha sido creado y se enviarán notificaciones.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.fecha_expiracion || 'Revisa los datos.';
        Swal.fire('Error', String(msg), 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      Swal.fire('Actualizado', 'Aviso modificado correctamente.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo actualizar.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      Swal.fire('Eliminado', 'Aviso borrado.', 'success');
    }
  });

  // --- HANDLERS ---
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

  const onSubmit = (data: Anuncio) => {
    // 1. Clonamos los datos para no romper el formulario
    const envio = { ...data };

    // 2. CORRECCIÓN: Si la fecha de expiración está vacía, enviamos null
    if (!envio.fecha_expiracion || String(envio.fecha_expiracion).trim() === '') {
        envio.fecha_expiracion = null;
    }

    // 3. BLINDAJE: Django prefiere formato ISO completo. 
    // Si el input manda "2024-01-01T12:00", le agregamos segundos ":00" por si acaso.
    if (envio.fecha_publicacion && envio.fecha_publicacion.length === 16) {
        envio.fecha_publicacion = `${envio.fecha_publicacion}:00`;
    }
    
    if (envio.fecha_expiracion && envio.fecha_expiracion.length === 16) {
        envio.fecha_expiracion = `${envio.fecha_expiracion}:00`;
    }

    // 4. Enviar a la mutación correspondiente
    if (avisoEditar) {
        updateMutation.mutate({ ...envio, id: avisoEditar.id });
    } else {
        createMutation.mutate(envio);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar aviso?', 
      text: "Desaparecerá del tablón permanentemente.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, borrar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const formatDate = (dateStr: string) => {
    try {
        // CORRECCIÓN: date-fns ya está instalado en el paso 1
        return format(new Date(dateStr), "d 'de' MMMM, h:mm a", { locale: es });
    } catch { return dateStr; }
  };

  if (isLoading) return <div className="p-8 text-center text-primary">Cargando avisos...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Megaphone className="text-primary" /> Tablón de Avisos
          </h1>
          <p className="text-text-secondary">Comunicados importantes de la USAER</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setVerMisAvisos(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!verMisAvisos ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Tablón General
            </button>
            <button 
                onClick={() => setVerMisAvisos(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${verMisAvisos ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Mis Publicaciones
            </button>
        </div>

        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
          <Plus size={20} /> Crear Aviso
        </button>
      </div>

      {/* LISTA DE AVISOS (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {avisos?.map((aviso) => (
            <div 
                key={aviso.id} 
                className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all ${
                    !aviso.es_activo && verMisAvisos ? 'opacity-75 bg-slate-50 border-slate-200' : ''
                }`}
            >
                {/* Header Tarjeta */}
                <div className="p-5 border-b border-slate-50 flex justify-between items-start">
                    <div>
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                           <Calendar size={12}/> {formatDate(aviso.fecha_publicacion)}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 leading-snug">{aviso.titulo}</h3>
                    </div>
                    {/* Solo mostramos acciones si estamos en "Mis Avisos" */}
                    {verMisAvisos && (
                        <div className="flex gap-1">
                            <button onClick={() => handleOpenEdit(aviso)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                <Edit2 size={16}/>
                            </button>
                            <button onClick={() => handleDelete(aviso.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    )}
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1">
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {aviso.contenido}
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {aviso.autor_nombre.charAt(0)}
                        </div>
                        {aviso.autor_nombre}
                    </div>

                    {aviso.fecha_expiracion && (
                        <div className={`flex items-center gap-1 ${!aviso.es_activo ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                            <Clock size={12} />
                            {aviso.es_activo 
                                ? `Vence: ${formatDate(aviso.fecha_expiracion).split(',')[0]}` 
                                : 'Expirado'
                            }
                        </div>
                    )}
                </div>
            </div>
        ))}

        {avisos?.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <Megaphone size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay avisos para mostrar en esta sección.</p>
            </div>
        )}
      </div>

      {/* --- MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={cerrarModal} title={avisoEditar ? "Editar Aviso" : "Nuevo Aviso"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Título del Aviso *</label>
                <input 
                    {...register('titulo', { required: true })} 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-primary outline-none" 
                    placeholder="Ej. Junta de Consejo Técnico"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Contenido *</label>
                <textarea 
                    {...register('contenido', { required: true })} 
                    rows={5}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-primary outline-none resize-none" 
                    placeholder="Escribe aquí los detalles del anuncio..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Publicación</label>
                    <input 
                        type="datetime-local" 
                        {...register('fecha_publicacion', { required: true })} 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Si es futura, se programará.</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Expiración (Opcional)</label>
                    <input 
                        type="datetime-local" 
                        {...register('fecha_expiracion')} 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Se ocultará automáticamente.</p>
                </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 text-xs text-blue-800">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                <p>Al publicar, se enviará una notificación a todos los usuarios activos del sistema.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={cerrarModal} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                    {avisoEditar ? 'Actualizar' : 'Publicar Aviso'}
                </button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default TablonAvisos;