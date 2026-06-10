import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { alumnoSchema, type AlumnoFormData, CLASIFICACIONES_OPCIONES } from '../../schemas/alumno';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, Users, Edit2, Trash2, 
  Save, School as SchoolIcon, Sparkles, Filter,
  CheckCircle, XCircle, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton, ErrorState } from '../../components/Skeletons';
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas'; 
import { getMaestros } from '../../api/usuarios';
import type { Alumno } from '../../interfaces/alumno';
import { DataTable } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import { useConfirmDialog } from '../../components/useConfirmDialog';
import type { ColumnDef } from '@tanstack/react-table';

const ListaAlumnos = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [filtroEscuela, setFiltroEscuela] = useState<string>('TODAS');
  const [filtroCondicion, setFiltroCondicion] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('ACTIVOS');
  const [page, setPage] = useState(1);
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDialog();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<AlumnoFormData>({
    resolver: zodResolver(alumnoSchema),
    defaultValues: { activo: true },
  });

  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced]);

  const { data: paginatedAlumnos, isLoading: loadingAlumnos, isError, error } = useQuery({
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
      toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Registrado!</span>, { description: 'El alumno ha sido dado de alta exitosamente.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'Revisa los datos (posible CURP ya registrada).' })
  });

  const updateMutation = useMutation({
    mutationFn: updateAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      toast.success(<span className="inline-flex items-center gap-1.5"><Pencil size={16} /> ¡Actualizado!</span>, { description: 'Datos escolares actualizados.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo guardar la información.' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminado!</span>, { description: 'El alumno ha sido dado de baja de la USAER.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se puede eliminar (registros vinculados).' })
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setAlumnoEditar(null);
    reset();
  };

  const columns: ColumnDef<Alumno>[] = [
    {
        accessorKey: 'nombres',
        header: 'Estudiante / CURP',
        cell: ({ row }) => {
            const item = row.original;
            return (
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
            );
        }
    },
    {
        accessorKey: 'escuela',
        header: 'Escuela de Procedencia',
        cell: ({ row }) => {
            const item = row.original;
            return (
                <div className="flex items-center gap-2">
                    <SchoolIcon size={16} className="text-primary" />
                    <div>
                        <p className="font-bold text-sm">{item.escuela_detalle?.nombre || `Escuela #${item.escuela}`}</p>
                        <p className="text-xs opacity-50">{item.grado}° Grado • Grupo "{item.grupo}"</p>
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: 'clasificacion',
        header: 'Diagnóstico',
        cell: ({ row }) => {
            const item = row.original;
            return (
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
            );
        }
    },
    {
        accessorKey: 'activo',
        header: 'Estatus',
        cell: ({ row }) => (
            <div className="flex justify-center">
                <span className={`badge badge-sm font-bold ${row.original.activo ? 'badge-success' : 'badge-error'}`}>
                    {row.original.activo ? 'Activo' : 'Baja'}
                </span>
            </div>
        )
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
            <div className="flex justify-center gap-2">
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
    reset({ ...alumno, fecha_nacimiento: alumno.fecha_nacimiento || undefined });
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<AlumnoFormData> = (data) => {
    const payload: Omit<Alumno, 'id'> & Partial<Pick<Alumno, 'id'>> = {
        nombres: data.nombres.toUpperCase(),
        apellido_paterno: data.apellido_paterno.toUpperCase(),
        apellido_materno: (data.apellido_materno || '').toUpperCase(),
        curp: data.curp.toUpperCase(),
        fecha_nacimiento: data.fecha_nacimiento,
        sexo: data.sexo,
        escuela: Number(data.escuela) || 0,
        profesor: !data.profesor || String(data.profesor) === '' ? null : Number(data.profesor),
        grado: data.grado,
        grupo: data.grupo.toUpperCase(),
        clasificacion: data.clasificacion as Alumno['clasificacion'],
        clasificacion_otro: data.clasificacion_otro,
        activo: data.activo,
    };

    if (alumnoEditar) {
        updateMutation.mutate({ ...payload, id: alumnoEditar.id } as Alumno);
    } else {
        createMutation.mutate(payload as Alumno);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDelete({
        title: 'Dar de Baja Alumno',
        message: '¿Dar de baja alumno? Se mantendrá el expediente histórico pero el alumno saldrá de atención activa.',
        variant: 'danger',
        confirmText: 'Dar de Baja',
    });
    if (ok) {
        deleteMutation.mutate(id);
    }
  };

  const clasificacionActual = watch('clasificacion');

  if (isError) return <ErrorState error={error} message="Error al cargar los alumnos. Intenta de nuevo." />;

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
      
      {/* FILTROS AVANZADOS */}
      <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-6">
        <div className="flex items-center gap-2 text-base-content/60">
          <Filter size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros Avanzados</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="form-control w-full">
            <label className="label" htmlFor="filtro_escuela"><span className="label-text font-bold">Escuela</span></label>
            <select 
              id="filtro_escuela"
              className="select select-bordered w-full" 
              value={filtroEscuela} 
              onChange={(e) => { setFiltroEscuela(e.target.value); setPage(1); }}
            >
              {escuelasOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div className="form-control w-full">
            <label className="label" htmlFor="filtro_diagnostico"><span className="label-text font-bold">Diagnóstico</span></label>
            <select 
              id="filtro_diagnostico"
              className="select select-bordered w-full" 
              value={filtroCondicion} 
              onChange={(e) => { setFiltroCondicion(e.target.value); setPage(1); }}
            >
              {condicionesOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div className="form-control w-full">
            <label className="label"><span className="label-text font-bold">Estado</span></label>
            <div className="join w-full">
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'ACTIVOS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setFiltroEstado('ACTIVOS'); setPage(1); }}
              >Activos</button>
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'BAJAS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setFiltroEstado('BAJAS'); setPage(1); }}
              >Bajas</button>
              <button 
                className={`btn btn-sm join-item ${filtroEstado === 'TODOS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setFiltroEstado('TODOS'); setPage(1); }}
              >Todos</button>
            </div>
          </div>
        </div>
      </div>
      
      <DataTable 
        data={alumnos} 
        columns={columns} 
        isLoading={loadingAlumnos}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        onSearchChange={setBusqueda}
        searchValue={busqueda}
        placeholder="Apellido, Nombre o CURP..."
      />
      
      <Modal
          isOpen={isModalOpen}
          onClose={cerrarModal}
          title={alumnoEditar ? "Modificar Ficha de Alumno" : "Inscripción de Nuevo Alumno"}
          icon={<Sparkles size={24} />}
          size="xl"
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* SECCIÓN 1: PERSONALES */}
              <div className="space-y-4 p-4 bg-base-200 rounded-2xl border border-base-300">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                   🍎 1. Datos Personales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Nombre(s)</span></label>
                    <input {...register('nombres', { required: "Obligatorio" })} className="input input-bordered" placeholder="Ej. LUIS ANGEL" />
                    {errors.nombres && <span className="text-error text-xs mt-1">{errors.nombres.message}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold">Apellido Paterno</span></label>
                    <input {...register('apellido_paterno', { required: "Obligatorio" })} className="input input-bordered" placeholder="Ej. VIDAL" />
                    {errors.apellido_paterno && <span className="text-error text-xs mt-1">{errors.apellido_paterno.message}</span>}
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
                    {errors.curp && <span className="text-error text-xs mt-1">{errors.curp.message}</span>}
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
                <p className="text-xs opacity-50"> * Deja vacío para asignación automática al docente actual.</p>
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
                <LoadingButton
                  type="submit"
                  className="btn btn-primary px-8"
                  icon={Save}
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  Guardar Ficha
                </LoadingButton>
              </div>
            </form>
        </Modal>
        {confirmDialog}
    </div>
  );
};

export default ListaAlumnos;
