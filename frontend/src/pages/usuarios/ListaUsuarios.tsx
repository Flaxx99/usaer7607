import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
    Plus, Search, Edit2, Trash2, Shield, Mail, Key, 
    Briefcase, Phone, School as SchoolIcon, User as UserIcon, CheckCircle, XCircle, Save, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
    Container, 
    Stack, 
    Paper, 
    Title, 
    Text, 
    Button, 
    Badge, 
    Group, 
    Avatar, 
    Modal, 
    TextInput, 
    Select, 
    ThemeIcon, 
    Center, 
    Loader, 
    Box, 
    Divider,
    Grid,
    ActionIcon,
    Tooltip,
    Textarea,
    FileInput,
    List,
    rem,
    SimpleGrid,
    Anchor,
    Checkbox,
    Alert,
    NumberInput,
    PasswordInput,
    Table,
    ScrollArea,
    Pagination
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';

import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { getEscuelas } from '../../api/escuelas';
import type { Usuario } from '../../interfaces/usuario';

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

  // Resetear a página 1 cuando cambia la búsqueda debounced
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
    queryFn: getEscuelas,
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      Swal.fire('¡Creado! 👤', 'Usuario registrado exitosamente.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.email ? 'El correo ya existe.' : 'Revisa los datos.';
        Swal.fire('Error ❌', msg, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      cerrarModal();
      Swal.fire('¡Actualizado! ✏️', 'Usuario modificado correctamente.', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se pudo actualizar.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      Swal.fire('¡Eliminado! 🗑️', 'Usuario eliminado.', 'success');
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
    Swal.fire({
      title: '¿Eliminar usuario?', 
      text: "Esta acción borrará el acceso permanentemente.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const getInitials = (u: Usuario) => {
    return `${(u.nombre?.[0] || '')}${(u.apellido_paterno?.[0] || '')}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'red';
      case 'DIRECTOR': return 'blue';
      case 'PSICOLOGO': return 'purple';
      case 'TRAB_SOCIAL': return 'orange';
      default: return 'teal';
    }
  };

  if (loadingUsuarios) {
      return (
        <Container size="xl" py="md">
          <TableSkeleton rows={10} />
        </Container>
      );
  }

  return (
    <Container size="xl" py="md">
        <Stack gap="xl">
            
            {/* ========================================================================= */}
            {/* CABECERA */}
            {/* ========================================================================= */}
            <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                            <Shield size={30} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                Gestión de Usuarios
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Administración de personal docente y administrativo de la USAER 7607.
                            </Text>
                        </div>
                    </Group>
                    
                    <Button 
                        size="lg" 
                        radius="md" 
                        leftSection={<Plus size={22} />} 
                        onClick={handleOpenCreate}
                        color="blue"
                        style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                    >
                        Nuevo Usuario
                    </Button>
                </Group>
            </Paper>

            {/* ========================================================================= */}
            {/* BUSCADOR */}
            {/* ========================================================================= */}
            <Paper p="md" radius="lg" withBorder shadow="xs">
                <TextInput 
                    size="md"
                    label="Buscar Personal"
                    placeholder="Escribe nombre, correo o número de empleado..." 
                    leftSection={<Search size={18} />}
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </Paper>

            {/* ========================================================================= */}
            {/* TABLA DE USUARIOS */}
            {/* ========================================================================= */}
            <Paper radius="lg" withBorder shadow="xs" overflow="hidden">
                <ScrollArea>
                    <Table striped highlightOnHover horizontalSpacing="md" verticalSpacing="sm" fontSize="md">
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th>Usuario</Table.Th>
                                <Table.Th>Rol / Puesto</Table.Th>
                                <Table.Th>Ubicación</Table.Th>
                                <Table.Th ta="center">Estado</Table.Th>
                                <Table.Th ta="center">Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                         <Table.Tbody>
                             {usuarios?.map((u) => (
                                 <Table.Tr key={u.id}>

                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar color={getRoleColor(u.role)} radius="xl" size="md">
                                                {getInitials(u)}
                                            </Avatar>
                                            <div>
                                                <Text fw={700} size="sm" c="gray.8">
                                                    {u.nombre} {u.apellido_paterno} {u.apellido_materno}
                                                </Text>
                                                <Group gap="xs" mt={2}>
                                                    <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Mail size={12} /> {u.email}
                                                    </Text>
                                                    {u.numero_empleado && (
                                                        <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Briefcase size={12} /> Emp: {u.numero_empleado}
                                                        </Text>
                                                    )}
                                                </Group>
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={getRoleColor(u.role)} variant="light" size="md" fw={600}>
                                            {ROLES_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                                        </Badge>
                                        {u.rfc && (
                                            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }} mt={4}>
                                                RFC: {u.rfc}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {u.escuela_detalle ? (
                                            <Group gap="xs">
                                                <SchoolIcon size={16} color="var(--mantine-color-gray-5)" />
                                                <Text size="sm" c="gray.7" fw={500}>{u.escuela_detalle.nombre}</Text>
                                            </Group>
                                        ) : (
                                            <Text size="xs" c="dimmed" fs="italic">Sin escuela asignada</Text>
                                        )}
                                        {u.celular && (
                                            <Text size="xs" c="dimmed" mt={4} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {u.celular}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        {u.activo ? (
                                            <ThemeIcon color="green" variant="light" size="lg" radius="xl">
                                                <CheckCircle size={18} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon color="gray" variant="light" size="lg" radius="xl">
                                                <XCircle size={18} />
                                            </ThemeIcon>
                                        )}
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group justify="center" gap="xs">
                                            <Tooltip label="Editar usuario">
                                                <ActionIcon 
                                                    variant="light" 
                                                    color="blue" 
                                                    size="lg" 
                                                    radius="md"
                                                    onClick={() => handleOpenEdit(u)}
                                                >
                                                    <Edit2 size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Eliminar usuario">
                                                <ActionIcon 
                                                    variant="light" 
                                                    color="red" 
                                                    size="lg" 
                                                    radius="md"
                                                    onClick={() => handleDelete(u.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                 </ScrollArea>
                 
                 {usuarios.length === 0 && (
                     <Center py="xl">
                         <Stack align="center">
                             <UserIcon size={48} color="var(--mantine-color-gray-4)" />
                             <Text fw={600} c="dimmed">No se encontraron usuarios con ese criterio.</Text>
                         </Stack>
                     </Center>
                 )}
             </Paper>
             
             <Group justify="center" py="md">
               <Pagination 
                 total={Math.ceil(totalCount / 10)} 
                 value={page} 
                 onChange={setPage} 
                 color="blue" 
                 radius="md" 
                 size="md" 
                 siblings={2} 
                 boundaries={1} 
               />
             </Group>
             
             {/* ========================================================================= */}

            {/* --- MODAL CREAR/EDITAR USUARIO --- */}
            {/* ========================================================================= */}
            <Modal 
              opened={isModalOpen} 
              onClose={cerrarModal} 
              title={<Title order={3} fw={800}>👤 {usuarioEditar ? "Editar Usuario" : "Nuevo Usuario"}</Title>}
              size="xl"
              radius="lg"
              centered
              scrollAreaComponent={ScrollArea.Autosize}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    
                    {/* SECCIÓN 1: CUENTA Y ACCESO */}
                    <Paper p="md" bg="blue.0" withBorder radius="md">
                        <Title order={4} fw={700} c="blue.7" mb="md" style={{ fontSize: '1rem' }}>
                            <Key size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Cuenta de Acceso
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <TextInput 
                                label="Correo Electrónico (Login)"
                                placeholder="correo@ejemplo.com"
                                required
                                {...register('email', { required: "El correo es obligatorio" })}
                                error={errors.email?.message}
                                size="md"
                            />
                            <PasswordInput 
                                label="Contraseña"
                                placeholder={usuarioEditar ? "(Dejar vacía para mantener)" : "Mínimo 5 caracteres"}
                                {...register('password', { required: !usuarioEditar, minLength: { value: 5, message: "Mínimo 5 caracteres" } })}
                                error={errors.password?.message}
                                size="md"
                            />
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: "El rol es obligatorio" }}
                                render={({ field }) => (
                                    <Select
                                        label="Rol en Sistema"
                                        placeholder="Selecciona un rol"
                                        data={ROLES_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        required
                                        size="md"
                                    />
                                )}
                            />
                            <Box style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                                <Checkbox 
                                    label="Usuario Activo (Acceso permitido)"
                                    {...register('activo')}
                                    size="md"
                                />
                            </Box>
                        </SimpleGrid>
                    </Paper>

                    {/* SECCIÓN 2: DATOS PERSONALES */}
                    <Paper p="md" bg="gray.0" withBorder radius="md">
                        <Title order={4} fw={700} c="gray.7" mb="md" style={{ fontSize: '1rem' }}>
                            <UserIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Datos Personales
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                            <TextInput 
                                label="Nombre(s)"
                                placeholder="Nombre"
                                required
                                {...register('nombre', { required: "El nombre es obligatorio" })}
                                error={errors.nombre?.message}
                                size="md"
                                style={{ textTransform: 'uppercase' }}
                            />
                            <TextInput 
                                label="Apellido Paterno"
                                placeholder="Apellido Paterno"
                                required
                                {...register('apellido_paterno', { required: "El apellido paterno es obligatorio" })}
                                error={errors.apellido_paterno?.message}
                                size="md"
                                style={{ textTransform: 'uppercase' }}
                            />
                            <TextInput 
                                label="Apellido Materno"
                                placeholder="Apellido Materno"
                                {...register('apellido_materno')}
                                size="md"
                                style={{ textTransform: 'uppercase' }}
                            />
                            <TextInput 
                                label="RFC"
                                placeholder="ABCD..."
                                {...register('rfc')}
                                size="md"
                                maxLength={13}
                                style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                            />
                            <TextInput 
                                label="CURP"
                                placeholder="CURP completo"
                                {...register('curp')}
                                size="md"
                                maxLength={18}
                                style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                            />
                        </SimpleGrid>
                    </Paper>

                    {/* SECCIÓN 3: DATOS LABORALES */}
                    <Paper p="md" bg="gray.0" withBorder radius="md">
                        <Title order={4} fw={700} c="gray.7" mb="md" style={{ fontSize: '1rem' }}>
                            <Briefcase size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Información Laboral
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                            <TextInput 
                                label="No. Empleado"
                                placeholder="Número de empleado"
                                {...register('numero_empleado')}
                                size="md"
                            />
                            <Controller
                                name="escuela"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Escuela Asignada"
                                        placeholder="Sin Asignar (Administrativo o Volante)"
                                        data={escuelas?.map(esc => ({
                                            value: String(esc.id),
                                            label: `${esc.nombre} (${esc.nivel} - ${esc.clave_estatal})`
                                        })) || []}
                                        value={field.value ? String(field.value) : ''}
                                        onChange={field.onChange}
                                        size="md"
                                        clearable
                                    />
                                )}
                            />
                            <Controller
                                name="situacion"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Situación"
                                        placeholder="Selecciona situación"
                                        data={SITUACION_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        size="md"
                                    />
                                )}
                            />
                            <TextInput 
                                label="Nivel Educativo"
                                placeholder="Ej. PRIMARIA"
                                {...register('nivel')}
                                size="md"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </SimpleGrid>
                    </Paper>

                    {/* SECCIÓN 4: CONTACTO */}
                    <Paper p="md" bg="gray.0" withBorder radius="md">
                        <Title order={4} fw={700} c="gray.7" mb="md" style={{ fontSize: '1rem' }}>
                            <Phone size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Contacto
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <TextInput 
                                label="Teléfono Fijo"
                                placeholder="Teléfono fijo"
                                {...register('telefono')}
                                size="md"
                            />
                            <TextInput 
                                label="Celular"
                                placeholder="Número de celular"
                                {...register('celular')}
                                size="md"
                            />
                            <TextInput 
                                label="Domicilio"
                                placeholder="Dirección completa"
                                {...register('domicilio')}
                                size="md"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </SimpleGrid>
                    </Paper>

                    {/* BOTONES */}
                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={cerrarModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="blue" leftSection={<Save size={18} />}>
                        {usuarioEditar ? 'Guardar Cambios' : 'Registrar Usuario'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
            </Modal>

        </Stack>
    </Container>
  );
};

export default ListaUsuarios;