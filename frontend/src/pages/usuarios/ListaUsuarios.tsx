import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usuarioSchema, type UsuarioFormData, ROLES_OPTIONS, SITUACION_OPTIONS } from '../../schemas/usuario';
import { 
    Plus, Edit2, Trash2, Shield, Mail, Key, 
    Briefcase, Phone, School as SchoolIcon, User as UserIcon, CheckCircle, XCircle, Save, User, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { getEscuelas } from '../../api/escuelas';
import type { Usuario } from '../../interfaces/usuario';
import { ErrorState } from '../../components/Skeletons';
import { DataTable } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import { useConfirmDialog } from '../../components/useConfirmDialog';
import type { ColumnDef } from '@tanstack/react-table';

// --- ESQUEMA DE VALIDACIÓN ZOD ---
// (Moved to frontend/src/schemas/usuario.ts)

const ListaUsuarios = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDialog();
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
        activo: true,
    }
  });


  // Reset to page 1 when search text changes (debounced).
  // This is intentionally a side effect tied to the derived debounced value,
  // not a direct state update. The alternative would couple page-reset logic
  // into every search input handler, which is more fragile.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { data: paginatedUsuarios, isLoading: loadingUsuarios, isError, error } = useQuery({
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
      toast.success(<span className="inline-flex items-center gap-1.5"><User size={16} /> ¡Creado!</span>, { description: 'Usuario registrado exitosamente.' });
    },
    onError: (err) => {
        const errorData = isAxiosError(err) ? err.response?.data as Record<string, unknown> | undefined : undefined;
        const msg = errorData?.email ? 'El correo ya existe.' : 'Revisa los datos.';
        toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: msg });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      toast.success(<span className="inline-flex items-center gap-1.5"><Pencil size={16} /> ¡Actualizado!</span>, { description: 'Usuario modificado correctamente.' });
    },
    onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo actualizar.' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminado!</span>, { description: 'Usuario eliminado.' });
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
        situacion: 'BASE',
        nombre: '',
        apellido_paterno: '',
        email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setUsuarioEditar(user);
    reset({ 
        ...user, 
        // password es write_only en el backend, no viene en GET
        password: '',
        // Aseguramos que los campos requeridos por Zod estén presentes
        nombre: user.nombre || '',
        apellido_paterno: user.apellido_paterno || '',
        email: user.email || '',
        role: user.role || 'MAESTRO_APOYO',
    });
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<UsuarioFormData> = (data) => {
    // Limpieza y normalización de datos (Standard USAER)
    const cleanedData = {
      ...data,
      rfc: data.rfc?.toUpperCase(),
      curp: data.curp?.toUpperCase(),
      nombre: data.nombre.toUpperCase(),
      apellido_paterno: data.apellido_paterno.toUpperCase(),
      apellido_materno: data.apellido_materno?.toUpperCase(),
      domicilio: data.domicilio?.toUpperCase(),
      nivel: data.nivel?.toUpperCase(),
      escuela: data.escuela ? Number(data.escuela) : null,
    };

    if (usuarioEditar) {
        updateMutation.mutate({ ...cleanedData, id: usuarioEditar.id });
    } else {
        createMutation.mutate(cleanedData as Usuario);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDelete({
        title: 'Eliminar Usuario',
        message: '¿Eliminar usuario? Esta acción borrará el acceso permanentemente.',
        variant: 'danger',
        confirmText: 'Eliminar',
    });
    if (ok) {
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
                        <p className="font-bold text-sm leading-tight">{u.nombre_completo || 'Sin nombre'}</p>
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

  if (isError) return <ErrorState error={error} message="Error al cargar los usuarios. Intenta de nuevo." />;

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

      <Modal
          isOpen={isModalOpen}
          onClose={cerrarModal}
          title={usuarioEditar ? "Editar Usuario" : "Nuevo Usuario"}
          icon={<UserIcon size={24} />}
          size="xl"
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Key size={16} /> Cuenta de Acceso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                          <label className="label" htmlFor="email"><span className="label-text text-xs font-bold">Correo Electrónico (Login)</span></label>
                          <input id="email" {...register('email', { required: "Obligatorio" })} className="input input-bordered" placeholder="correo@ejemplo.com" />
                          {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
                      </div>
                      <div className="form-control">
                          <label className="label" htmlFor="password"><span className="label-text text-xs font-bold">Contraseña</span></label>
                          <input id="password" type="password" {...register('password', { required: !usuarioEditar, minLength: { value: 5, message: "Mínimo 5 chars" } })} className="input input-bordered" placeholder={usuarioEditar ? "Dejar vacía para mantener" : "Mínimo 5 caracteres"} />
                          {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
                      </div>
                      <div className="form-control">
                          <label className="label" htmlFor="role"><span className="label-text text-xs font-bold">Rol en Sistema</span></label>
                          <Controller name="role" control={control} rules={{ required: "Obligatorio" }} render={({ field }) => (
                              <select id="role" {...field} className="select select-bordered">
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
                            <label className="label" htmlFor="nombre"><span className="label-text text-xs font-bold">Nombre(s)</span></label>
                                <input id="nombre" {...register('nombre', { required: "Obligatorio" })} className="input input-bordered uppercase" />
                          </div>
                          <div className="form-control">
<label className="label" htmlFor="apellido_paterno"><span className="label-text text-xs font-bold">Apellido Paterno</span></label>
                               <input id="apellido_paterno" {...register('apellido_paterno', { required: "Obligatorio" })} className="input input-bordered uppercase" />
                          </div>
                          <div className="form-control">
<label className="label" htmlFor="apellido_materno"><span className="label-text text-xs font-bold">Apellido Materno</span></label>
                               <input id="apellido_materno" {...register('apellido_materno')} className="input input-bordered uppercase" />
                          </div>
                          <div className="form-control">
<label className="label" htmlFor="rfc"><span className="label-text text-xs font-bold">RFC</span></label>
                               <input id="rfc" {...register('rfc')} className="input input-bordered uppercase font-mono" />
                          </div>
                          <div className="form-control">
<label className="label" htmlFor="curp"><span className="label-text text-xs font-bold">CURP</span></label>
                               <input id="curp" {...register('curp')} className="input input-bordered uppercase font-mono" />
                          </div>
                        </div>
                  </div>

                  <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> Información Laboral</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="form-control">
<label className="label" htmlFor="numero_empleado"><span className="label-text text-xs font-bold">No. Empleado</span></label>
                               <input id="numero_empleado" {...register('numero_empleado')} className="input input-bordered" />
                          </div>
                          <div className="form-control">
                               <label className="label" htmlFor="escuela"><span className="label-text text-xs font-bold">Escuela Asignada</span></label>
                               <Controller name="escuela" control={control} render={({ field }) => (
                                   <select id="escuela" {...field} className="select select-bordered" value={field.value ? String(field.value) : ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                                      <option value="">Sin Asignar</option>
                                      {escuelas?.map(esc => <option key={esc.id} value={esc.id}>{esc.nombre}</option>)}
                                  </select>
                              )} />
                          </div>
                          <div className="form-control">
                               <label className="label" htmlFor="situacion"><span className="label-text text-xs font-bold">Situación</span></label>
                               <Controller name="situacion" control={control} render={({ field }) => (
                                   <select id="situacion" {...field} className="select select-bordered">
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
<label className="label" htmlFor="telefono"><span className="label-text text-xs font-bold">Teléfono Fijo</span></label>
                                 <input id="telefono" {...register('telefono')} className="input input-bordered" />
                            </div>
                            <div className="form-control">
<label className="label" htmlFor="celular"><span className="label-text text-xs font-bold">Celular</span></label>
                                 <input id="celular" {...register('celular')} className="input input-bordered" />
                            </div>
                            <div className="form-control col-span-full">
<label className="label" htmlFor="domicilio"><span className="label-text text-xs font-bold">Domicilio</span></label>
                                 <input id="domicilio" {...register('domicilio')} className="input input-bordered uppercase" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                            <LoadingButton type="submit" className="btn btn-primary px-8 flex items-center gap-2" icon={Save} loading={createMutation.isPending || updateMutation.isPending}>
                                {usuarioEditar ? 'Guardar Cambios' : 'Registrar Usuario'}
                            </LoadingButton>
                    </div>
            </form>
        </Modal>
        {confirmDialog}
    </>
  );
};

export default ListaUsuarios;
