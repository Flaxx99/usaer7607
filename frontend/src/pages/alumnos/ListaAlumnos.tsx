import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Search, Users, Edit2, Trash2, GraduationCap, 
    Save, School as SchoolIcon, Activity
} from 'lucide-react';
import Swal from 'sweetalert2';

// API
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas'; 
import { getMaestros } from '../../api/usuarios'; // <--- IMPORTANTE

// INTERFACES
import type { Alumno } from '../../interfaces/alumno';

import Modal from '../../components/Modal';

const ListaAlumnos = () => {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Alumno>();

  // 1. CARGA DE DATOS
  const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
    queryKey: ['alumnos'],
    queryFn: getAlumnos,
  });

  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: getEscuelas,
  });

  const { data: maestros } = useQuery({
    queryKey: ['maestros'],
    queryFn: getMaestros,
  });

  // --- LÓGICA DINÁMICA DE GRADOS ---
  const escuelaIdSeleccionada = watch('escuela');

  const gradosDisponibles = useMemo(() => {
    if (!escuelas || !escuelaIdSeleccionada) return [1, 2, 3, 4, 5, 6]; 

    const escuelaEncontrada = escuelas.find(e => e.id === Number(escuelaIdSeleccionada));
    
    if (!escuelaEncontrada) return [1, 2, 3, 4, 5, 6];

    const nivel = escuelaEncontrada.nivel.toUpperCase();

    if (nivel.includes('PREESCOLAR') || nivel.includes('KINDER')) {
        return [1, 2, 3];
    } else if (nivel.includes('SECUNDARIA') || nivel.includes('TELESECUNDARIA')) {
        return [1, 2, 3];
    } else {
        return [1, 2, 3, 4, 5, 6];
    }
  }, [escuelas, escuelaIdSeleccionada]);

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      Swal.fire('Registrado', 'El alumno ha sido registrado.', 'success');
    },
    onError: () => Swal.fire('Error', 'Revisa los datos (posible CURP duplicada).', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: updateAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      Swal.fire('Actualizado', 'Datos guardados correctamente.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo actualizar.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se puede eliminar (quizás tiene expedientes).', 'error')
  });

  // --- FUNCIONES ---
  const cerrarModal = () => {
    setIsModalOpen(false);
    setAlumnoEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setAlumnoEditar(null);
    reset({
        activo: true,
        sexo: 'H',
        grado: '1',
        clasificacion: 'NINGUNO',
        grupo: 'A',
        escuela: undefined,
        profesor: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (alumno: Alumno) => {
    setAlumnoEditar(alumno);
    reset(alumno); 
    setIsModalOpen(true);
  };

  const onSubmit = (data: Alumno) => {
    // Conversiones a mayúsculas
    data.nombres = data.nombres.toUpperCase();
    data.apellido_paterno = data.apellido_paterno.toUpperCase();
    data.apellido_materno = data.apellido_materno ? data.apellido_materno.toUpperCase() : '';
    data.curp = data.curp.toUpperCase();
    data.grupo = data.grupo.toUpperCase();

    // --- CORRECCIÓN TYPESCRIPT ---
    // Verificamos si es null, undefined o cadena vacía ""
    if (!data.profesor || String(data.profesor) === "") {
        data.profesor = null; 
    } else {
        // Aseguramos que sea número
        data.profesor = Number(data.profesor);
    }

    if (alumnoEditar) {
        updateMutation.mutate({ ...data, id: alumnoEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Borrar alumno?', text: "Esta acción no se puede deshacer.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, borrar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const alumnosFiltrados = alumnos?.filter(a => 
    a.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.apellido_paterno.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.curp.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clasificacionActual = watch('clasificacion');

  if (loadingAlumnos) return <div className="p-8 text-center text-primary">Cargando alumnos...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Users className="text-primary" /> Alumnado
          </h1>
          <p className="text-text-secondary">Gestión de alumnos en atención</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
          <Plus size={20} /> Nuevo Alumno
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" placeholder="Buscar por nombre, apellido o CURP..." 
          className="flex-1 bg-transparent outline-none"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-text-secondary text-sm uppercase">
                <th className="p-4 font-semibold">Alumno</th>
                <th className="p-4 font-semibold">Escuela / Grado</th>
                <th className="p-4 font-semibold">Diagnóstico</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {alumnosFiltrados?.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 group">
                    <td className="p-4 align-top">
                        <div className="font-bold text-text-main">
                            {item.nombres} {item.apellido_paterno} {item.apellido_materno}
                        </div>
                        <div className="text-xs text-text-secondary mt-1 font-mono">
                            {item.curp} • {item.sexo}
                        </div>
                        {/* Mostrar Profesor si está asignado explícitamente */}
                        {item.profesor && (
                            <div className="text-[10px] text-blue-600 mt-1 bg-blue-50 inline-block px-1 rounded border border-blue-100">
                                Docente Asignado
                            </div>
                        )}
                    </td>
                    <td className="p-4 align-top">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <SchoolIcon size={14} className="text-slate-400" />
                            {item.escuela_detalle?.nombre || `Escuela #${item.escuela}`}
                        </div>
                        <div className="text-sm text-text-secondary mt-1 pl-5">
                            {item.grado}° "{item.grupo}"
                        </div>
                    </td>
                    <td className="p-4 align-top">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            item.clasificacion === 'NINGUNO' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            item.clasificacion === 'DISCAPACIDAD' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                            {item.clasificacion.replace('_', ' ')}
                        </span>
                        {item.clasificacion_otro && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                                "{item.clasificacion_otro}"
                            </div>
                        )}
                    </td>
                    <td className="p-4 text-center align-middle">
                        {item.activo ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Activo</span>
                        ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Baja</span>
                        )}
                    </td>
                    <td className="p-4 text-center align-middle">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {alumnosFiltrados?.length === 0 && (
            <div className="p-8 text-center text-text-secondary">
                No se encontraron alumnos.
            </div>
        )}
      </div>

      {/* --- MODAL FORMULARIO --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={cerrarModal} 
        title={alumnoEditar ? "Editar Alumno" : "Nuevo Alumno"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-primary border-b border-blue-200 pb-2 flex items-center gap-2">
                    <Users size={16} /> Datos Personales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre(s)</label>
                        <input {...register('nombres', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" placeholder="Ej. LUIS ANGEL" />
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Apellido Paterno</label>
                        <input {...register('apellido_paterno', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" placeholder="Ej. VIDAL" />
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Apellido Materno</label>
                        <input {...register('apellido_materno')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" placeholder="Ej. BUSTAMANTE" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CURP</label>
                        <input {...register('curp', { required: true, minLength: 18, maxLength: 18 })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white uppercase font-mono" placeholder="18 CARACTERES" />
                        {errors.curp && <span className="text-xs text-red-500">CURP inválida</span>}
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha Nacimiento</label>
                        <input type="date" {...register('fecha_nacimiento')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" />
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sexo</label>
                        <select {...register('sexo')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white">
                            <option value="H">Hombre</option>
                            <option value="M">Mujer</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN NUEVA: ASIGNACIÓN DE DOCENTE */}
            {/* Se muestra para todos, pero es especialmente útil para Admins/Directores */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-primary border-b border-blue-200 pb-2 flex items-center gap-2">
                    <Users size={16} /> Asignación de Docente
                </h3>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Maestro Responsable</label>
                    <select 
                        {...register('profesor')} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    >
                        <option value="">-- Asignación Automática / Sin Asignar --</option>
                        {maestros?.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nombre} {m.apellido_paterno} ({m.email})
                            </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                        * Dejar vacío para asignación automática al usuario actual (si aplica).
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: DATOS ESCOLARES */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-primary border-b border-blue-200 pb-2 flex items-center gap-2">
                    <GraduationCap size={16} /> Datos Escolares
                </h3>
                
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Escuela de Procedencia</label>
                    <select 
                        {...register('escuela', { required: "Selecciona una escuela" })} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    >
                        <option value="">-- Seleccionar Escuela --</option>
                        {escuelas?.map(esc => (
                            <option key={esc.id} value={esc.id}>
                                {esc.nombre} ({esc.nivel})
                            </option>
                        ))}
                    </select>
                    {errors.escuela && <span className="text-xs text-red-500">Este campo es requerido</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grado</label>
                        <select 
                            {...register('grado')} 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        >
                            {gradosDisponibles.map(g => (
                                <option key={g} value={g}>{g}° Grado</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</label>
                        <input {...register('grupo', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white uppercase text-center font-bold" placeholder="A" maxLength={2} />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: CLASIFICACIÓN USAER */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-primary border-b border-blue-200 pb-2 flex items-center gap-2">
                    <Activity size={16} /> Clasificación USAER
                </h3>
                
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Condición / Diagnóstico</label>
                    <select {...register('clasificacion')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white">
                        <option value="NINGUNO">NINGUNO (En proceso de evaluación)</option>
                        <option value="DISCAPACIDAD">DISCAPACIDAD</option>
                        <option value="DIFICULTADES_SEVERAS">DIFICULTADES SEVERAS DE APRENDIZAJE</option>
                        <option value="TRASTORNOS">TRASTORNOS (TDAH, TEA...)</option>
                        <option value="APTITUDES_SOBRESALIENTES">APTITUDES SOBRESALIENTES</option>
                        <option value="OTRO">OTRO</option>
                    </select>
                </div>

                {clasificacionActual === 'OTRO' && (
                    <div className="flex flex-col gap-1 animate-fade-in-down">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Especifique condición:</label>
                        <input {...register('clasificacion_otro', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" placeholder="Detalle la condición..." />
                    </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" {...register('activo')} id="activoCheck" className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer" />
                    <label htmlFor="activoCheck" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                        Alumno Activo (En atención actual)
                    </label>
                </div>
            </div>

            {/* BOTONES */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={cerrarModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="bg-primary text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
                >
                    <Save size={18} /> 
                    {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Datos'}
                </button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default ListaAlumnos;