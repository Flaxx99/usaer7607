import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Calendar, Edit2, Trash2, CheckCircle, AlertTriangle, Layers, ArrowRightCircle,
    GraduationCap, TrendingUp, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';

// API
import { 
    getCiclos, createCiclo, updateCiclo, deleteCiclo, 
    previewPromocion, ejecutarPromocion 
} from '../../api/ciclos';

import type { CicloEscolar } from '../../interfaces/ciclo';
import Modal from '../../components/Modal';

const ListaCiclos = () => {
  // Estados para CRUD Ciclos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cicloEditar, setCicloEditar] = useState<CicloEscolar | null>(null);

  // Estados para Promoción
  const [isPromocionOpen, setIsPromocionOpen] = useState(false);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm<CicloEscolar>();

  // --- QUERY CICLOS ---
  const { data: ciclos, isLoading } = useQuery({
    queryKey: ['ciclos'],
    queryFn: getCiclos,
  });

  // --- QUERY PREVIEW PROMOCIÓN (Solo se ejecuta si el modal está abierto) ---
  const { data: previewData, isLoading: loadingPreview, isError: errorPreview, refetch: refetchPreview } = useQuery({
    queryKey: ['promocionPreview'],
    queryFn: previewPromocion,
    enabled: isPromocionOpen, // <--- Truco: Solo carga cuando abres el modal
    retry: false
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createCiclo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      Swal.fire('Guardado', 'El ciclo escolar ha sido registrado.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.non_field_errors || 'Revisa las fechas.';
        Swal.fire('Error', String(msg), 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateCiclo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      if (isModalOpen) Swal.fire('Actualizado', 'Datos actualizados.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.non_field_errors || 'No se pudo actualizar.';
        Swal.fire('Error', String(msg), 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCiclo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      Swal.fire('Eliminado', 'El ciclo ha sido borrado.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se puede eliminar este ciclo.', 'error')
  });

  const ejecutarPromocionMutation = useMutation({
    mutationFn: ejecutarPromocion,
    onSuccess: (data) => {
        setIsPromocionOpen(false);
        // Invalidamos alumnos también porque sus grados cambiaron
        queryClient.invalidateQueries({ queryKey: ['alumnos'] }); 
        Swal.fire({
            title: '¡Promoción Exitosa!',
            html: `
                <div class="text-left text-sm">
                    <p><strong>Alumnos promovidos:</strong> ${data.promovidos}</p>
                    <p><strong>Alumnos graduados (Baja):</strong> ${data.graduados}</p>
                </div>
            `,
            icon: 'success'
        });
    },
    onError: () => Swal.fire('Error', 'Hubo un problema al ejecutar la promoción.', 'error')
  });

  // --- HANDLERS CICLOS ---
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

  const onSubmit = (data: CicloEscolar) => {
    if (cicloEditar) {
        updateMutation.mutate({ ...data, id: cicloEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleActivarCiclo = (ciclo: CicloEscolar) => {
    if (ciclo.activo) return;
    Swal.fire({
        title: `¿Activar Ciclo ${ciclo.nombre}?`,
        text: "Este pasará a ser el ciclo actual. El anterior se desactivará.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, activar',
        confirmButtonColor: '#2563eb'
    }).then((r) => {
        if (r.isConfirmed) {
            updateMutation.mutate({ ...ciclo, activo: true });
        }
    });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar ciclo?', text: "Esta acción no se puede deshacer.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, borrar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  // --- HANDLER PROMOCIÓN ---
  const handleConfirmarPromocion = () => {
    Swal.fire({
        title: '¿ESTÁS SEGURO?',
        text: "Esto avanzará de grado a los alumnos activos y dará de baja a los que terminan nivel. Esta acción es masiva.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, Ejecutar Cierre',
        cancelButtonText: 'Cancelar'
    }).then((r) => {
        if (r.isConfirmed) {
            ejecutarPromocionMutation.mutate();
        }
    });
  };

  // Validación visual
  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const fechasInvalidas = fechaInicio && fechaFin && fechaInicio > fechaFin;

  if (isLoading) return <div className="p-8 text-center text-primary">Cargando ciclos...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Layers className="text-primary" /> Ciclos Escolares
          </h1>
          <p className="text-text-secondary">Define los periodos de trabajo y el ciclo vigente</p>
        </div>
        <div className="flex gap-2">
            {/* BOTÓN PROMOCIÓN */}
            <button 
                onClick={() => setIsPromocionOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium transition-colors"
            >
                <TrendingUp size={20} /> Promoción de Grado
            </button>

            {/* BOTÓN NUEVO CICLO */}
            <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium transition-colors">
                <Plus size={20} /> Nuevo Ciclo
            </button>
        </div>
      </div>

      {/* LISTA DE TARJETAS */}
      <div className="space-y-4">
        {ciclos?.map((ciclo) => (
            <div 
                key={ciclo.id} 
                className={`relative flex flex-col md:flex-row items-center justify-between p-5 rounded-xl border transition-all ${
                    ciclo.activo 
                    ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-300' 
                    : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                }`}
            >
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 rounded-full flex-shrink-0 ${ciclo.activo ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${ciclo.activo ? 'text-blue-800' : 'text-slate-700'}`}>
                            {ciclo.nombre}
                            {ciclo.activo && (
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                                    <CheckCircle size={10} /> Vigente
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <span className="font-mono">{ciclo.fecha_inicio}</span>
                            <ArrowRightCircle size={12} className="text-slate-300"/>
                            <span className="font-mono">{ciclo.fecha_fin}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    {!ciclo.activo && (
                        <button 
                            onClick={() => handleActivarCiclo(ciclo)}
                            className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium flex items-center gap-2 shadow-sm"
                        >
                            <CheckCircle size={14} /> Activar
                        </button>
                    )}
                    <button onClick={() => handleOpenEdit(ciclo)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18}/>
                    </button>
                    <button onClick={() => handleDelete(ciclo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
        ))}
        {ciclos?.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <AlertTriangle size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay ciclos escolares registrados.</p>
            </div>
        )}
      </div>

      {/* --- MODAL DE CRUD CICLOS --- */}
      <Modal isOpen={isModalOpen} onClose={cerrarModal} title={cicloEditar ? "Editar Ciclo" : "Nuevo Ciclo Escolar"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Ciclo *</label>
                <input 
                    {...register('nombre', { required: true })} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-center uppercase focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="Ej. 2024-2025"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Inicio *</label>
                    <input type="date" {...register('fecha_inicio', { required: true })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Fin *</label>
                    <input type="date" {...register('fecha_fin', { required: true })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                </div>
            </div>
            {fechasInvalidas && (
                <div className="bg-red-50 text-red-600 p-2 text-xs rounded border border-red-100 flex items-center gap-2">
                    <AlertTriangle size={14} /> La fecha de inicio debe ser anterior al fin.
                </div>
            )}
            {!cicloEditar && (
                 <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-2">
                    <input type="checkbox" {...register('activo')} id="activoCheck" className="mt-1 w-4 h-4 text-primary rounded cursor-pointer" />
                    <label htmlFor="activoCheck" className="text-sm text-yellow-800 cursor-pointer select-none">
                        <strong>Marcar como Ciclo Activo</strong>
                        <p className="text-xs text-yellow-700 mt-0.5">
                            Al guardar, el sistema desactivará cualquier otro ciclo vigente.
                        </p>
                    </label>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={cerrarModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors">
                    {cicloEditar ? 'Actualizar Ciclo' : 'Guardar Ciclo'}
                </button>
            </div>
        </form>
      </Modal>

      {/* --- MODAL ESPECIAL: PROMOCIÓN --- */}
      <Modal isOpen={isPromocionOpen} onClose={() => setIsPromocionOpen(false)} title="Simulación de Cierre de Ciclo" maxWidth="max-w-3xl">
         <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm">
                <p className="flex items-center gap-2 font-bold mb-1"><TrendingUp size={16}/> ¿Qué hace esta herramienta?</p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-blue-700/80">
                    <li>Avanza de grado a los alumnos activos (ej. 1° → 2°).</li>
                    <li>Gradúa (da de baja) a los que terminan nivel (ej. 6° Primaria → Egresado).</li>
                    <li>No afecta a alumnos inactivos o dados de baja anteriormente.</li>
                </ul>
            </div>

            {loadingPreview ? (
                <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                    <p>Analizando alumnos...</p>
                </div>
            ) : errorPreview ? (
                <div className="py-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="mx-auto mb-2" size={32} />
                    <p>Error al cargar la simulación.</p>
                    <button onClick={() => refetchPreview()} className="text-sm underline mt-2">Reintentar</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TARJETA PROMOVER */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{previewData?.a_promover_count}</h3>
                        <p className="text-sm text-slate-500 font-medium">Serán Promovidos</p>
                        <p className="text-xs text-slate-400 mt-1">Pasan al siguiente grado</p>
                    </div>

                    {/* TARJETA GRADUAR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <GraduationCap size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{previewData?.a_graduar_count}</h3>
                        <p className="text-sm text-slate-500 font-medium">Serán Graduados</p>
                        <p className="text-xs text-slate-400 mt-1">Egresan del nivel</p>
                    </div>

                     {/* TARJETA TOTAL */}
                     <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="bg-slate-100 text-slate-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{previewData?.total_activos}</h3>
                        <p className="text-sm text-slate-500 font-medium">Total Analizados</p>
                        <p className="text-xs text-slate-400 mt-1">Alumnos activos hoy</p>
                    </div>
                </div>
            )}

            {/* BOTONES ACCIÓN */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setIsPromocionOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                    Cancelar
                </button>
                <button 
                    onClick={handleConfirmarPromocion}
                    disabled={loadingPreview || !!errorPreview || ejecutarPromocionMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {ejecutarPromocionMutation.isPending ? (
                        <>Procesando...</>
                    ) : (
                        <><TrendingUp size={18} /> Ejecutar Cierre y Promoción</>
                    )}
                </button>
            </div>
         </div>
      </Modal>

    </div>
  );
};

export default ListaCiclos;