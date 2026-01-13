import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, School, Edit2, Trash2, MapPin, Save, AlertTriangle } from 'lucide-react';
import { getEscuelas, deleteEscuela, createEscuela, updateEscuela } from '../../api/escuelas';
import type { Escuela } from '../../interfaces/escuela';
import Modal from '../../components/Modal';
import Swal from 'sweetalert2';

// Función auxiliar para convertir "PRIMARIA" -> "Primaria"
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ListaEscuelas = () => {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escuelaEditar, setEscuelaEditar] = useState<Escuela | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Escuela>();

  // Queries & Mutations
  const { data: escuelas, isLoading, isError } = useQuery({
    queryKey: ['escuelas'],
    queryFn: getEscuelas,
  });

  const createMutation = useMutation({
    mutationFn: createEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      Swal.fire('¡Creada!', 'La escuela se registró correctamente.', 'success');
    },
    onError: (error: any) => manejarError(error)
  });

  const updateMutation = useMutation({
    mutationFn: updateEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      Swal.fire('¡Actualizada!', 'Los datos han sido guardados.', 'success');
    },
    onError: (error: any) => manejarError(error)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      Swal.fire('¡Eliminado!', 'La escuela ha sido eliminada.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
  });

  const manejarError = (error: any) => {
    console.error("Error del servidor:", error.response?.data);
    let mensaje = 'Verifique los datos.';
    if (error.response?.data) {
        const data = error.response.data;
        const campo = Object.keys(data)[0];
        const errorMsg = data[campo];
        mensaje = `${campo.toUpperCase()}: ${errorMsg}`;
    }
    Swal.fire('Error al guardar', mensaje, 'error');
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEscuelaEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setEscuelaEditar(null);
    reset({
        nivel: 'Primaria', // Valor válido para Django
        zona: '', clave_estatal: '', cct: '', nombre: '', domicilio: '', colonia: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (escuela: Escuela) => {
    setEscuelaEditar(escuela);
    
    // TRUCO: Convertimos el nivel que viene de la BD (PRIMARIA) a lo que espera el select (Primaria)
    const datosParaFormulario = {
        ...escuela,
        nivel: toTitleCase(escuela.nivel) // "PRIMARIA" -> "Primaria"
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
    Swal.fire({
      title: '¿Estás seguro?', text: "Se borrará permanentemente", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(id);
    });
  };

  const escuelasFiltradas = escuelas?.filter(escuela => 
    escuela.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    escuela.clave_estatal.toLowerCase().includes(busqueda.toLowerCase()) ||
    escuela.cct.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <School className="text-primary" /> Escuelas
          </h1>
          <p className="text-text-secondary">Administra los centros de trabajo</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95">
          <Plus size={20} /> Nueva Escuela
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" placeholder="Buscar por nombre, CCT o clave..." className="flex-1 bg-transparent outline-none"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-text-secondary text-sm uppercase">
              <th className="p-4 font-semibold">CCT / Nivel</th>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold hidden md:table-cell">Ubicación</th>
              <th className="p-4 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {escuelasFiltradas?.map((escuela) => (
              <tr key={escuela.id} className="hover:bg-blue-50/50 group">
                <td className="p-4 align-top">
                    <div className="font-bold text-text-main font-mono">{escuela.cct}</div>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold border bg-slate-100 text-slate-600 border-slate-200 capitalize">
                        {escuela.nivel.toLowerCase()}
                    </span>
                </td>
                <td className="p-4 align-top">
                    <div className="font-medium text-lg text-primary">{escuela.nombre}</div>
                    <div className="text-sm text-text-secondary mt-1">
                        Zona: <span className="font-semibold text-slate-700">{escuela.zona}</span>
                    </div>
                </td>
                <td className="p-4 hidden md:table-cell align-top">
                    <div className="flex items-start gap-1.5 text-sm text-text-secondary">
                        <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-medium text-text-main">{escuela.domicilio}</span>
                            <span className="text-xs text-slate-500">{escuela.colonia}</span>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-center align-middle">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(escuela)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(escuela.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={cerrarModal} title={escuelaEditar ? "Editar Escuela" : "Nueva Escuela"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Clave Estatal</label>
                    <input {...register('clave_estatal', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 transition-all" />
                    {errors.clave_estatal && <span className="text-red-500 text-xs">{errors.clave_estatal.message}</span>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">CCT</label>
                    <input {...register('cct', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 transition-all" />
                    {errors.cct && <span className="text-red-500 text-xs">{errors.cct.message}</span>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nombre de la Escuela</label>
                <input {...register('nombre', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nivel</label>
                    {/* CAMBIO: Values en Title Case (lo que Django acepta como input) */}
                    <select {...register('nivel')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none bg-white">
                        <option value="Primaria">Primaria</option>
                        <option value="Preescolar">Preescolar</option>
                        <option value="Secundaria">Secundaria</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Zona</label>
                    <input {...register('zona', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Domicilio</label>
                    <input {...register('domicilio', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Colonia</label>
                    <input {...register('colonia', { required: "Requerido" })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary" />
                </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-700">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>El turno y los datos del director no son obligatorios en este paso.</p>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-text-secondary hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : <><Save size={18} /> Guardar</>}
                </button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default ListaEscuelas;