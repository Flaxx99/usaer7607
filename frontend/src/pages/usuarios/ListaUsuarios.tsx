import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
    Plus, Edit2, Trash2, Shield, Mail, Key, 
    Briefcase, Phone, School as SchoolIcon, User as UserIcon, CheckCircle, XCircle, Save, User
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { getEscuelas } from '../../api/escuelas';
import type { Usuario } from '../../interfaces/usuario';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

const ROLES_OPTIONS = [
    { value: 'ADMIN', label: 'Administrador del Sistema' }, 
    { value: 'DIRECTOR', label: 'Director(a)' },
    { value: 'MAESTRO_APOYO', label: 'Maestro(a) de Apoyo' },
    { value: 'PSICOLOGO', label: 'Psicólogo(a)' },
    { value: 'TRAB_SOCIAL', label: 'Trabajador(a) Social' },
    { value: 'COMUNICACION', label: 'Mtro. Comunicación' },
    { value: 'PSICOMOTRICIDAD', label: 'Mtro. Psicomotricidad' },
    { value: 'TRAB_MANUAL', label: 'Trabajador Manual' },
    { value: 'SECRETARIO', label: 'Secretario(a)' },
];

const SITUACION_OPTIONS = [
    { value: 'BASE', label: 'Base' },
    { value: 'INTERINO', label: 'Interino' },
    { value: 'CONTRATO', label: 'Contrato' },
];

const ListaUsuarios = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Usuario>();

  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced]);

  const { data: paginatedUsuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios', page, busquedaDebounced],
    queryFn: () => getUsuarios(page, busquedaDebounced),
  });

  const usuarios = paginatedUsuarios?.results || [];
  const totalCount = paginatedUsuarios?.count || 0;

  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: () => getEscuelas(),
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      toast.success('¡Creado! 👤', { description: 'Usuario registrado exitosamente.' });
    },
    onError: (err: any) => {
        const msg = err.response?.data?.email ? 'El correo ya existe.' : 'Revisa los datos.';
        toast.error('Error ❌', { description: msg });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      toast.success('¡Actualizado! ✏️', { description: 'Usuario modificado correctamente.' });
    },
    onError: () => toast.error('Error ❌', { description: 'No se pudo actualizar.' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('¡Eliminado! 🗑️', { description: 'Usuario eliminado.' });
    }
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setUsuarioEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setUsuarioEditar(null);
    reset({ 
        activo: true, 
        role: 'MAESTRO_APOYO',
        nivel: 'PRIMARIA', 
        situacion: 'BASE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setUsuarioEditar(user);
    reset({ ...user, password: '' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: Usuario) => {
    if(data.rfc) data.rfc = data.rfc.toUpperCase();
    if(data.curp) data.curp = data.curp.toUpperCase();
    if(data.nombre) data.nombre = data.nombre.toUpperCase();
    if(data.apellido_paterno) data.apellido_paterno = data.apellido_paterno.toUpperCase();
    if(data.apellido_materno) data.apellido_materno = data.apellido_materno?.toUpperCase();
    if(data.domicilio) data.domicilio = data.domicilio?.toUpperCase();
    if(data.nivel) data.nivel = data.nivel?.toUpperCase();
    if (String(data.escuela) === "") data.escuela = null;

    if (usuarioEditar) {
        updateMutation.mutate({ ...data, id: usuarioEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar usuario? Esta acción borrará el acceso permanentemente.')) {
        deleteMutation.mutate(id);
    }
  };

  const getInitials = (u: Usuario) => {
    return `${(u.nombre?.[0] || '')}${(u.apellido_paterno?.[0] || '')}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'badge-error';
      case 'DIRECTOR': return 'badge-info';
      case 'PSICOLOGO': return 'badge-secondary';
      case 'TRAB_SOCIAL': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  const columns: ColumnDef<Usuario>[] = [
    {
        accessorKey: 'nombre',
        header: 'Usuario',
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className="flex items-center gap-3">
                    <div className={`avatar placeholder ${getRoleColor(u.role)}`}>
                        <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 font-bold text-sm">
                            {getInitials(u)}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">{u.nombre} {u.apellido_paterno} {u.apellido_materno}</p>
                        <div className="flex gap-1 mt-1">
                            <span className="text-xs opacity-60 flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                            {u.numero_empleado && (
                                <span className="text-xs opacity-60 flex items-center gap-1"><Briefcase size={12} /> Emp: {u.numero_empleado}</span>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: 'role',
        header: 'Rol / Puesto',
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div>
                    <span className={`badge badge-sm font-bold ${getRoleColor(u.role)}`}>
                        {ROLES_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                    </span>
                    {u.rfc && <p className="text-xs opacity-50 font-mono mt-1">RFC: {u.rfc}</p>}
                </div>
            );
        }
    },
    {
        accessorKey: 'escuela',
        header: 'Ubicación',
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div>
                    {u.escuela_detalle ? (
                        <div className="flex items-center gap-1">
                            <SchoolIcon size={14} className="opacity-50" />
                            <span className="text-xs font-medium">{u.escuela_detalle.nombre}</span>
                        </div>
                    ) : (
                        <span className="text-xs opacity-50 italic">Sin escuela</span>
                    )}
                    {u.celular && (
                        <p className="text-xs opacity-50 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {u.celular}
                        </p>
                    )}
                </div>
            );
        }
    },
    {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className="flex justify-center">
                    {u.activo ? <CheckCircle size={18} className="text-success" /> : <XCircle size={18} className="text-base-content/30" />}
                </div>
            );
        }
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className="flex justify-center gap-2">
                    <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(u)}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></button>
                </div>
            );
        }
    }
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
          <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
              <div className="card-body p-8 flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                          <Shield size={30} />
                      </div>
                      <div>
                          <h1 className="text-3xl font-black tracking-tight">Gestión de Usuarios</h1>
                          <p className="text-sm opacity-90 font-medium">Administración de personal docente y administrativo de la USAER 7607.</p>
                      </div>
                  </div>
                  <button className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform" onClick={handleOpenCreate}>
                      <Plus size={22} />
                      Nuevo Usuario
                  </button>
              </div>
          </div>

          <DataTable 
            data={usuarios} 
            columns={columns} 
            isLoading={loadingUsuarios}
            totalCount={totalCount}
            page={page}
            onPageChange={setPage}
            onSearchChange={setBusqueda}
            searchValue={busqueda}
            placeholder="Escribe nombre, correo o número de empleado..."
          />
      </div>

      {isModalOpen && (
          <div className="modal modal-open">
              <div className="modal-box max-w-3xl p-0 overflow-hidden">
                  <div className="bg-primary p-6 text-primary-content flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-2"><UserIcon size={24} className="text-yellow-300" /> {usuarioEditar ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                      <button className="btn btn-ghost btn-circle btn-sm text-white" onClick={cerrarModal}>✕</button>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                      <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                          <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Key size={16} /> Cuenta de Acceso</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="form-control">
                                  <label className="label"><span className="label-text text-xs font-bold">Correo Electrónico (Login)</span></label>
                                  <input {...register('email', { required: "Obligatorio" })} className="input input-bordered" placeholder="correo@ejemplo.com" />
                                  {errors.email && <span className="text-error text-[10px] mt-1">{errors.email.message}</span>}
                              </div>
                              <div className="form-control">
                                  <label className="label"><span className="label-text text-xs font-bold">Contraseña</span></label>
                                  <input type="password" {...register('password', { required: !usuarioEditar, minLength: { value: 5, message: "Mínimo 5 chars" } })} className="input input-bordered" placeholder={usuarioEditar ? "Dejar vacía para mantener" : "Mínimo 5 caracteres"} />
                                  {errors.password && <span className="text-error text-[10px] mt-1">{errors.password.message}</span>}
                              </div>
                              <div className="form-control">
                                  <label className="label"><span className="label-text text-xs font-bold">Rol en Sistema</span></label>
                                  <Controller name="role" control={control} rules={{ required: "Obligatorio" }} render={({ field }) => (
                                      <select {...field} className="select select-bordered">
                                          {ROLES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                      </select>
                                  )} />
                                </div>
                                <div className="flex items-center gap-3 p-2">
                                    <input type="checkbox" {...register('activo')} className="checkbox checkbox-primary" />
                                    <span className="text-sm font-medium">Usuario Activo</span>
                                </div>
                            </div>
                          </div>

                          <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><User size={16} /> Datos Personales</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">Nombre(s)</span></label>
                                      <input {...register('nombre', { required: "Obligatorio" })} className="input input-bordered uppercase" />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">Apellido Paterno</span></label>
                                      <input {...register('apellido_paterno', { required: "Obligatorio" })} className="input input-bordered uppercase" />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">Apellido Materno</span></label>
                                      <input {...register('apellido_materno')} className="input input-bordered uppercase" />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">RFC</span></label>
                                      <input {...register('rfc')} className="input input-bordered uppercase font-mono" />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">CURP</span></label>
                                      <input {...register('curp')} className="input input-bordered uppercase font-mono" />
                                  </div>
                                </div>
                          </div>

                          <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> Información Laboral</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">No. Empleado</span></label>
                                      <input {...register('numero_empleado')} className="input input-bordered" />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">Escuela Asignada</span></label>
                                      <Controller name="escuela" control={control} render={({ field }) => (
                                          <select {...field} className="select select-bordered" value={field.value ? String(field.value) : ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                                              <option value="">Sin Asignar</option>
                                              {escuelas?.map(esc => <option key={esc.id} value={esc.id}>{esc.nombre}</option>)}
                                          </select>
                                      )} />
                                  </div>
                                  <div className="form-control">
                                      <label className="label"><span className="label-text text-xs font-bold">Situación</span></label>
                                      <Controller name="situacion" control={control} render={({ field }) => (
                                          <select {...field} className="select select-bordered">
                                              {SITUACION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                          </select>
                                      )} />
                                  </div>
                                </div>
                            </div>

                            <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Phone size={16} /> Contacto</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text text-xs font-bold">Teléfono Fijo</span></label>
                                        <input {...register('telefono')} className="input input-bordered" />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text text-xs font-bold">Celular</span></label>
                                        <input {...register('celular')} className="input input-bordered" />
                                    </div>
                                    <div className="form-control col-span-full">
                                        <label className="label"><span className="label-text text-xs font-bold">Domicilio</span></label>
                                        <input {...register('domicilio')} className="input input-bordered uppercase" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                                <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary px-8 flex items-center gap-2"><Save size={18} /> {usuarioEditar ? 'Guardar Cambios' : 'Registrar Usuario'}</button>
                            </div>
                    </form>
                </div>
                <div className="modal-backdrop" onClick={cerrarModal}></div>
            </div>
        )}
    </>
  );
};

export default ListaUsuarios;
