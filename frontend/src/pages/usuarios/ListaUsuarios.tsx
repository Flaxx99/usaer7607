import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Search, Edit2, Trash2, Shield, Mail, Key, 
    Briefcase, Phone, School as SchoolIcon, User as UserIcon, CheckCircle, XCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

// APIs
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { getEscuelas } from '../../api/escuelas';

// Interfaces
import type { Usuario } from '../../interfaces/usuario';

import Modal from '../../components/Modal';

// Roles (Deben coincidir EXACTAMENTE con los códigos en tu modelo de Django)
const ROLES_OPTIONS = [
    // CORRECCIÓN AQUÍ: Cambiamos 'ADMINISTRADOR' por 'ADMIN'
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

const ListaUsuarios = () => {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Usuario>();

  // --- QUERIES ---
  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });

  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: getEscuelas,
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      Swal.fire('Creado', 'Usuario registrado exitosamente.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.email ? 'El correo ya existe.' : 'Revisa los datos.';
        Swal.fire('Error', msg, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      Swal.fire('Actualizado', 'Usuario modificado correctamente.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo actualizar. Revisa la consola.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      Swal.fire('Eliminado', 'Usuario eliminado.', 'success');
    }
  });

  // --- HANDLERS ---
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
    // Conversiones estéticas a Mayúsculas
    if(data.rfc) data.rfc = data.rfc.toUpperCase();
    if(data.curp) data.curp = data.curp.toUpperCase();
    if(data.nombre) data.nombre = data.nombre.toUpperCase();
    if(data.apellido_paterno) data.apellido_paterno = data.apellido_paterno.toUpperCase();
    if(data.apellido_materno) data.apellido_materno = data.apellido_materno?.toUpperCase();
    if(data.domicilio) data.domicilio = data.domicilio?.toUpperCase();
    if(data.nivel) data.nivel = data.nivel?.toUpperCase();
    
    // Convertir escuela "" a null
    if (String(data.escuela) === "") data.escuela = null;

    if (usuarioEditar) {
        updateMutation.mutate({ ...data, id: usuarioEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar usuario?', 
      text: "Esta acción borrará el acceso permanentemente.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  // --- FILTRADO SEGURO ---
  const listaSegura = Array.isArray(usuarios) ? usuarios : [];

  const usuariosFiltrados = listaSegura.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.apellido_paterno?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.numero_empleado?.includes(busqueda)
  );

  if (loadingUsuarios) return <div className="p-8 text-center text-primary">Cargando usuarios...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Shield className="text-primary" /> Gestión de Usuarios
          </h1>
          <p className="text-text-secondary">Administración de personal docente y administrativo</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {/* FILTRO */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" placeholder="Buscar por nombre, correo o #empleado..." 
          className="flex-1 bg-transparent outline-none"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-4">Usuario</th>
                <th className="p-4">Rol / Puesto</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados?.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/50 group">
                    <td className="p-4">
                        <div className="font-bold text-slate-800">{u.nombre} {u.apellido_paterno} {u.apellido_materno}</div>
                        <div className="text-xs text-slate-500 flex flex-col mt-1 gap-0.5">
                            <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                            {u.numero_empleado && <span className="flex items-center gap-1"><Briefcase size={12} /> Emp: {u.numero_empleado}</span>}
                        </div>
                    </td>
                    <td className="p-4 align-top">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100 block w-fit mb-1">
                            {ROLES_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                        </span>
                        {u.rfc && <div className="text-[10px] text-slate-400 font-mono">RFC: {u.rfc}</div>}
                    </td>
                    <td className="p-4 align-top">
                        {u.escuela_detalle ? (
                            <div className="text-sm text-slate-700 flex items-center gap-1">
                                <SchoolIcon size={14} className="text-slate-400"/> 
                                <span>{u.escuela_detalle.nombre}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Sin escuela asignada</span>
                        )}
                        {u.celular && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone size={12}/> {u.celular}</div>}
                    </td>
                    <td className="p-4 text-center align-middle">
                        {u.activo ? (
                             <div className="flex justify-center"><CheckCircle size={18} className="text-green-500"/></div>
                        ) : (
                             <div className="flex justify-center"><XCircle size={18} className="text-red-400"/></div>
                        )}
                    </td>
                    <td className="p-4 text-center align-middle">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={18}/></button>
                            <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={18}/></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={cerrarModal} title={usuarioEditar ? "Editar Usuario" : "Nuevo Usuario"} maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* SECCIÓN 1: CUENTA Y ACCESO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><Key size={16}/> Cuenta de Acceso</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico (Login) *</label>
                    <input type="email" {...register('email', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña</label>
                    <input 
                        type="password" 
                        {...register('password', { required: !usuarioEditar, minLength: 5 })} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                        placeholder={usuarioEditar ? "(Dejar vacía para mantener)" : "Mínimo 5 caracteres"}
                    />
                    {errors.password && <span className="text-xs text-red-500">Requerida (min 5 caracteres)</span>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Rol en Sistema *</label>
                    <select {...register('role', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                        {ROLES_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg w-full">
                        <input type="checkbox" {...register('activo')} id="actCheck" className="w-4 h-4 text-primary rounded cursor-pointer" />
                        <label htmlFor="actCheck" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Usuario Activo (Acceso permitido)</label>
                    </div>
                </div>
             </div>
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><UserIcon size={16}/> Datos Personales</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre(s) *</label>
                    <input {...register('nombre', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Apellido Paterno *</label>
                    <input {...register('apellido_paterno', { required: true })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Apellido Materno</label>
                    <input {...register('apellido_materno')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">RFC</label>
                    <input {...register('rfc')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none font-mono" maxLength={13} placeholder="ABCD..." />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">CURP</label>
                    <input {...register('curp')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none font-mono" maxLength={18} />
                </div>
             </div>
          </div>

          {/* SECCIÓN 3: DATOS LABORALES */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><Briefcase size={16}/> Información Laboral</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">No. Empleado</label>
                    <input {...register('numero_empleado')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Escuela Asignada</label>
                    <select {...register('escuela')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                        <option value="">-- Sin Asignar (Administrativo o Volante) --</option>
                        {escuelas?.map(esc => (
                            <option key={esc.id} value={esc.id}>
                                {esc.nombre} ({esc.nivel} - {esc.clave_estatal})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Situación</label>
                    <select {...register('situacion')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                        <option value="BASE">Base</option>
                        <option value="INTERINO">Interino</option>
                        <option value="CONTRATO">Contrato</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nivel Educativo</label>
                    <input {...register('nivel')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none" placeholder="Ej. PRIMARIA" />
                </div>
             </div>
          </div>

          {/* SECCIÓN 4: CONTACTO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><Phone size={16}/> Contacto</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono Fijo</label>
                    <input {...register('telefono')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Celular</label>
                    <input {...register('celular')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio</label>
                    <input {...register('domicilio')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase outline-none" />
                </div>
             </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={cerrarModal} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors">
                Guardar Usuario
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
};

export default ListaUsuarios;