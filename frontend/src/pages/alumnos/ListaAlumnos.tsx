import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
  Plus, Search, Users, Edit2, Trash2, 
  Save, School as SchoolIcon, Sparkles, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas'; 
import { getMaestros } from '../../api/usuarios';
import type { Alumno } from '../../interfaces/alumno';

const CLASIFICACIONES_OPCIONES = [
  { value: 'NINGUNO', label: 'NINGUNO (En evaluación)' },
  { value: 'DISCAPACIDAD', label: 'DISCAPACIDAD' },
  { value: 'DIFICULTADES_SEVERAS', label: 'DIFICULTADES SEVERAS' },
  { value: 'TRASTORNOS', label: 'TRASTORNOS (TDAH, TEA...)' },
  { value: 'APTITUDES_SOBRESALIENTES', label: 'APTITUDES SOBRESALIENTES' },
  { value: 'OTRO', label: 'OTRO (Especifique)' }
];

const ListaAlumnos = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [filtroEscuela, setFiltroEscuela] = useState<string>('TODAS');
  const [filtroCondicion, setFiltroCondicion] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('ACTIVOS');
  const [page, setPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<Alumno>();

  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced]);

  const { data: paginatedAlumnos, isLoading: loadingAlumnos } = useQuery({
    queryKey: ['alumnos', page, busquedaDebounced, filtroEscuela, filtroCondicion, filtroEstado],
    queryFn: () => getAlumnos(page, busquedaDebounced, filtroEscuela || '', filtroCondicion || '', filtroEstado),
  });

  const alumnos = paginatedAlumnos?.results || [];
  const totalCount = paginatedAlumnos?.count || 0;

  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: () => getEscuelas(),
  });

  const { data: maestros } = useQuery({
    queryKey: ['maestros'],
    queryFn: getMaestros,
  });

  const escuelasOpciones = useMemo(() => {
    if (!escuelas) return [{ value: 'TODAS', label: '🏫 Todas las Escuelas' }];
    return [
      { value: 'TODAS', label: '🏫 Todas las Escuelas' },
      ...escuelas.map(e => ({ value: String(e.id), label: `${e.nombre} (${e.nivel})` }))
    ];
  }, [escuelas]);

  const condicionesOpciones = useMemo(() => {
    return [
      { value: 'TODAS', label: '🩺 Todas las Condiciones' },
      ...CLASIFICACIONES_OPCIONES
    ];
  }, []);

  const escuelaIdSeleccionada = watch('escuela');

  const gradosDisponibles = useMemo(() => {
    if (!escuelas || !escuelaIdSeleccionada) return ['1', '2', '3', '4', '5', '6']; 
    const escuelaEncontrada = escuelas.find(e => e.id === Number(escuelaIdSeleccionada));
    if (!escuelaEncontrada) return ['1', '2', '3', '4', '5', '6'];

    const nivel = escuelaEncontrada.nivel.toUpperCase();
    if (nivel.includes('PREESCOLAR') || nivel.includes('KINDER') || nivel.includes('SECUNDARIA')) {
        return ['1', '2', '3'];
    } else {
        return ['1', '2', '3', '4', '5', '6'];
    }
  }, [escuelas, escuelaIdSeleccionada]);

  const createMutation = useMutation({
    mutationFn: createAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      toast.success('¡Registrado!', { description: 'El alumno ha sido dado de alta exitosamente.' });
    },
    onError: () => toast.error('Error', { description: 'Revisa los datos (posible CURP ya registrada).' })
  });

  const updateMutation = useMutation({
    mutationFn: updateAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      toast.success('¡Guardado!', { description: 'Datos escolares actualizados.' });
    },
    onError: () => toast.error('Error', { description: 'No se pudo guardar la información.' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      toast.success('Eliminado', { description: 'El alumno ha sido dado de baja de la USAER.' });
    },
    onError: () => toast.error('Error', { description: 'No se puede eliminar (registros vinculados).' })
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setAlumnoEditar(null);
    reset();
  };

  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1);
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
    data.nombres = data.nombres.toUpperCase();
    data.apellido_paterno = data.apellido_paterno.toUpperCase();
    data.apellido_materno = data.apellido_materno ? data.apellido_materno.toUpperCase() : '';
    data.curp = data.curp.toUpperCase();
    data.grupo = data.grupo.toUpperCase();

    if (!data.profesor || String(data.profesor) === "") {
        data.profesor = null; 
    } else {
        data.profesor = Number(data.profesor);
    }

    if (alumnoEditar) {
        updateMutation.mutate({ ...data, id: alumnoEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Dar de baja alumno? Se mantendrá el expediente histórico pero el alumno saldrá de atención activa.')) {
        deleteMutation.mutate(id);
    }
  };

  const clasificacionActual = watch('clasificacion');

  if (loadingAlumnos) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <TableSkeleton rows={10} />
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
              <Users size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Control de Alumnos
              </h1>
              <p className="text-sm opacity-90 font-medium">
                Lista oficial y expedientes de estudiantes atendidos por la USAER 7607
              </p>
            </div>
          </div>
          <button 
            className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
            onClick={handleOpenCreate}
          >
            <Plus size={22} />
            Nuevo Ingreso Alumno
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-6">
        <div className="flex items-center gap-2 text-base-content/60">
          <Filter size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros de Búsqueda Rápida</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="form-control w-full">
            <label className="label"><span className="label-text font-bold">Buscar Alumno</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
              <input 
                type="text" 
                placeholder="Apellido, Nombre o CURP..." 
                className="input input-bordered pl-10 w-full" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-control w-full">
            <label className="label"><span className="label-text font-bold">Escuela</span></label>
            <select 
              className="select select-bordered w-full" 
              value={filtroEscuela} 
              onChange={(e) => handleFilterChange(setFiltroEscuela, e.target.value)}
            >
              {escuelasOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-bold">Diagnóstico</span></label>
            <select 
              className="select select-bordered w-full" 
              value={filtroCondicion} 
              onChange={(e) => handleFilterChange(setFiltroCondicion, e.target.value)}
            >
              {condicionesOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-bold">Estado</span></label>
            <div className="join w-full">
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'ACTIVOS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleFilterChange(setFiltroEstado, 'ACTIVOS')}
              >Activos</button>
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'BAJAS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleFilterChange(setFiltroEstado, 'BAJAS')}
              >Bajas</button>
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'TODOS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleFilterChange(setFiltroEstado, 'TODOS')}
              >Todos</button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-md table-zebra w-full">
            <thead className="bg-base-200">
              <tr className="text-xs uppercase opacity-60">
                <th>Estudiante / CURP</th>
                <th>Escuela de Procedencia</th>
                <th>Diagnóstico</th>
                <th className="text-center">Estatus</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((item) => (
                <tr key={item.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className={`avatar-placeholder ${item.sexo === 'H' ? 'bg-blue-200 text-blue-700' : 'bg-purple-200 text-purple-700'} rounded-full w-10 h-10 font-bold text-lg`}>
                          {item.nombres.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{item.nombres} {item.apellido_paterno} {item.apellido_materno}</p>
                        <div className="flex gap-1 mt-1">
                          <span className="badge badge-ghost badge-xs font-mono opacity-60">{item.curp}</span>
                          <span className="badge badge-ghost badge-xs opacity-60">{item.sexo === 'H' ? 'Niño' : 'Niña'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <SchoolIcon size={16} className="text-primary" />
                      <div>
                        <p className="font-bold text-sm">{item.escuela_detalle?.nombre || `Escuela #${item.escuela}`}</p>
                        <p className="text-xs opacity-50">{item.grado}° Grado • Grupo "{item.grupo}"</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`badge badge-sm font-bold ${
                        item.clasificacion === 'NINGUNO' ? 'badge-ghost' :
                        item.clasificacion === 'DISCAPACIDAD' ? 'badge-info' :
                        item.clasificacion === 'DIFICULTADES_SEVERAS' ? 'badge-warning' :
                        item.clasificacion === 'TRASTORNOS' ? 'badge-error' : 'badge-secondary'
                      }`}>
                        {item.clasificacion.replace('_', ' ')}
                      </span>
                      {item.clasificacion_otro && (
                        <p className="text-xs italic opacity-60 pl-1">"{item.clasificacion_otro}"</p>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`badge badge-sm font-bold ${item.activo ? 'badge-success' : 'badge-error'}`}>
                      {item.activo ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center gap-2">
                      <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alumnos.length === 0 && (
            <div className="p-12 text-center text-base-content/40 italic">
              🔍 No encontramos alumnos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
        
        <div className="flex justify-center p-4 border-t border-base-200">
          <div className="join">
            <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
            <button className="join-item btn btn-sm no-animation">{page} / {Math.ceil(totalCount / 10)}</button>
            <button className="join-item btn btn-sm" disabled={page >= Math.ceil(totalCount / 10)} onClick={() => setPage(p => p + 1)}>»</button>
          </div>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl p-0 overflow-hidden bg-base-100">
            <div className="bg-primary p-6 text-primary-content flex items-center gap-3">
              <Sparkles size={24} className="text-yellow-300" />
              <h3 className="text-xl font-black">
                {alumnoEditar ? "Modificar Ficha de Alumno" : "Inscripción de Nuevo Alumno"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              
              {/* SECCIÓN 1: PERSONALES */}
              <div className="space-y-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                   🍎 1. Datos Personales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Nombre(s)</span></label>
                    <input {...register('nombres', { required: "Obligatorio" })} className="input input-bordered" placeholder="Ej. LUIS ANGEL" />
                    {errors.nombres && <span className="text-error text-[10px] mt-1">{errors.nombres.message}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Apellido Paterno</span></label>
                    <input {...register('apellido_paterno', { required: "Obligatorio" })} className="input input-bordered" placeholder="Ej. VIDAL" />
                    {errors.apellido_paterno && <span className="text-error text-[10px] mt-1">{errors.apellido_paterno.message}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Apellido Materno</span></label>
                    <input {...register('apellido_materno')} className="input input-bordered" placeholder="Ej. BUSTAMANTE" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">CURP</span></label>
                    <input 
                      {...register('curp', { 
                        required: "Obligatorio", 
                        minLength: { value: 18, message: "18 caracteres" },
                        maxLength: { value: 18, message: "18 caracteres" }
                      })} 
                      className="input input-bordered font-mono uppercase" 
                      placeholder="18 CARACTERES" 
                    />
                    {errors.curp && <span className="text-error text-[10px] mt-1">{errors.curp.message}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Fecha Nacimiento</span></label>
                    <input type="date" {...register('fecha_nacimiento')} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Sexo</span></label>
                    <Controller
                      name="sexo"
                      control={control}
                      defaultValue="H"
                      render={({ field }) => (
                        <select {...field} className="select select-bordered">
                          <option value="H">Niño (Hombre)</option>
                          <option value="M">Niña (Mujer)</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DOCENTE */}
              <div className="space-y-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                   🧑‍🏫 2. Maestro de Apoyo USAER
                </h4>
                <Controller
                  name="profesor"
                  control={control}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      className="select select-bordered w-full"
                      value={field.value ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione el maestro de apoyo...</option>
                      {maestros?.map(m => <option key={m.id} value={m.id}>{m.nombre} {m.apellido_paterno} ({m.email})</option>)}
                    </select>
                  )}
                />
                <p className="text-[10px] opacity-50"> * Deja vacío para asignación automática al docente actual.</p>
              </div>

              {/* SECCIÓN 3: ESCOLARES */}
              <div className="space-y-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                   🏫 3. Ubicación Escolar
                </h4>
                <Controller
                  name="escuela"
                  control={control}
                  rules={{ required: "Obligatorio" }}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      className="select select-bordered w-full"
                      value={field.value ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">Busca la escuela...</option>
                      {escuelas?.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.nivel})</option>)}
                    </select>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="grado"
                    control={control}
                    defaultValue="1"
                    render={({ field }) => (
                      <select {...field} className="select select-bordered">
                        {gradosDisponibles.map(g => <option key={g} value={g}>{g}° Grado</option>)}
                      </select>
                    )}
                  />
                  <div className="form-control">
                    <input {...register('grupo', { required: "Obligatorio" })} className="input input-bordered text-center uppercase" placeholder="Ej. A" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: DIAGNÓSTICO */}
              <div className="space-y-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                   🩺 4. Clasificación USAER
                </h4>
                <Controller
                  name="clasificacion"
                  control={control}
                  defaultValue="NINGUNO"
                  render={({ field }) => (
                    <select {...field} className="select select-bordered w-full">
                      {CLASIFICACIONES_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  )}
                />
                {clasificacionActual === 'OTRO' && (
                  <input {...register('clasificacion_otro', { required: "Obligatorio" })} className="input input-bordered" placeholder="Especifique condición..." />
                )}
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-base-300">
                  <input type="checkbox" {...control.register('activo')} className="checkbox checkbox-primary" defaultChecked />
                  <span className="text-sm font-medium">Atención Activa (recibe apoyo actualmente)</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary px-8" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <><Save size={18} /> Guardar Ficha</>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={cerrarModal}></div>
        </div>
      )}
    </div>
  );
};

export default ListaAlumnos;
