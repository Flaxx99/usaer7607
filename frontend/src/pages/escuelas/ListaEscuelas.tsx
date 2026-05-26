import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Search, School, Edit2, Trash2, MapPin, Save, AlertTriangle, Phone, Mail } from 'lucide-react';
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
    SegmentedControl,
    SimpleGrid
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton } from '../../components/Skeletons';

import { getEscuelas, deleteEscuela, createEscuela, updateEscuela } from '../../api/escuelas';
import type { Escuela } from '../../interfaces/escuela';

// Función auxiliar para convertir "PRIMARIA" -> "Primaria"
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const NIVELES_OPCIONES = [
  { value: 'Primaria', label: '🏫 Primaria' },
  { value: 'Preescolar', label: '🧸 Preescolar' },
  { value: 'Secundaria', label: '🎓 Secundaria' },
  { value: 'Telesecundaria', label: '📡 Telesecundaria' },
];

const ListaEscuelas = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escuelaEditar, setEscuelaEditar] = useState<Escuela | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Escuela>();

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
      Swal.fire('¡Creada! 🏫', 'La escuela se registró correctamente en el sistema.', 'success');
    },
    onError: (error: any) => manejarError(error)
  });

  const updateMutation = useMutation({
    mutationFn: updateEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      cerrarModal();
      Swal.fire('¡Actualizada! ✏️', 'Los datos de la escuela han sido guardados.', 'success');
    },
    onError: (error: any) => manejarError(error)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEscuela,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escuelas'] });
      Swal.fire('¡Eliminada! 🗑️', 'La escuela ha sido dada de baja del sistema.', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se pudo eliminar (posiblemente tiene alumnos asignados).', 'error')
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
    Swal.fire('Error al guardar ❌', mensaje, 'error');
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEscuelaEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setEscuelaEditar(null);
    reset({
        nivel: 'Primaria',
        zona: '', clave_estatal: '', cct: '', nombre: '', domicilio: '', colonia: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (escuela: Escuela) => {
    setEscuelaEditar(escuela);
    const datosParaFormulario = {
        ...escuela,
        nivel: toTitleCase(escuela.nivel)
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
      title: '¿Eliminar escuela?', 
      text: "Esta acción es irreversible. Asegúrate de que no tenga alumnos activos.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(id);
    });
  };

  const escuelasFiltradas = escuelas?.filter(escuela => 
    escuela.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    escuela.clave_estatal.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    escuela.cct.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  if (isLoading) {
      return (
        <Container size="xl" py="md">
          <CardGridSkeleton cols={6} />
        </Container>
      );
      );
  }
  if (isError) return <Center h="50vh"><Text c="red">Error al cargar datos del servidor.</Text></Center>;

  return (
    <Container size="xl" py="md">
        <Stack gap="xl">
            
            {/* ========================================================================= */}
            {/* CABECERA DEL DIRECTORIO */}
            {/* ========================================================================= */}
            <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                            <School size={30} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                Directorio de Escuelas
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Administra los centros de trabajo y escuelas regulares vinculadas a la USAER 7607.
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
                        Registrar Nueva Escuela
                    </Button>
                </Group>
            </Paper>

            {/* ========================================================================= */}
            {/* BUSCADOR GIGANTE */}
            {/* ========================================================================= */}
            <Paper p="md" radius="lg" withBorder shadow="xs">
                <TextInput 
                    size="md"
                    label="Buscar Escuela"
                    placeholder="Escribe el nombre, CCT o Clave Estatal..." 
                    leftSection={<Search size={18} />}
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </Paper>

            {/* ========================================================================= */}
            {/* REJILLA DE ESCUELAS (DISEÑO TIPO TARJETA) */}
            {/* ========================================================================= */}
            <Grid gutter="lg">
                {escuelasFiltradas?.map((escuela) => (
                    <Grid.Col key={escuela.id} span={{ base: 12, md: 6, lg: 4 }}>
                        <Paper 
                            p="lg" 
                            radius="lg" 
                            withBorder 
                            shadow="xs"
                            style={{ 
                                borderLeft: `6px solid var(--mantine-color-blue-6)`,
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            className="hover:shadow-md"
                        >
                            <Stack gap="xs">
                                {/* CCT y Nivel */}
                                <Group justify="space-between" align="flex-start">
                                    <Badge color="gray" variant="light" size="md" fw={700} style={{ fontFamily: 'monospace' }}>
                                        CCT: {escuela.cct}
                                    </Badge>
                                    <Badge 
                                        color={escuela.nivel.includes('PRIMARIA') ? 'blue' : escuela.nivel.includes('PREESCOLAR') ? 'orange' : 'teal'} 
                                        variant="light" 
                                        size="md"
                                    >
                                        {toTitleCase(escuela.nivel)}
                                    </Badge>
                                </Group>

                                {/* Nombre */}
                                <Title order={3} fw={800} c="gray.8" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                                    {escuela.nombre}
                                </Title>

                                <Divider my="xs" />

                                {/* Ubicación */}
                                <Stack gap={4}>
                                    <Group gap="xs">
                                        <MapPin size={16} className="text-blue-500" />
                                        <Text size="sm" c="gray.7" fw={600}>{escuela.domicilio}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Box w={22} /> {/* Spacer para alinear */}
                                        <Text size="sm" c="dimmed">Col. {escuela.colonia} • Zona {escuela.zona}</Text>
                                    </Group>
                                </Stack>

                                {/* Acciones */}
                                <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}>
                                    <Tooltip label="Editar datos de la escuela">
                                        <Button 
                                            variant="light" 
                                            color="blue" 
                                            size="xs" 
                                            leftSection={<Edit2 size={14} />}
                                            onClick={() => handleOpenEdit(escuela)}
                                        >
                                            Editar
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Eliminar escuela">
                                        <Button 
                                            variant="light" 
                                            color="red" 
                                            size="xs" 
                                            leftSection={<Trash2 size={14} />}
                                            onClick={() => handleDelete(escuela.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </Tooltip>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                ))}

                {escuelasFiltradas?.length === 0 && (
                    <Grid.Col span={12}>
                        <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                          <School size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                          <Text fw={600} c="dimmed">No se encontraron escuelas con ese criterio de búsqueda.</Text>
                        </Paper>
                    </Grid.Col>
                )}
            </Grid>

            {/* ========================================================================= */}
            {/* --- MODAL CREAR/EDITAR ESCUELA (FORMULARIO ESCOLAR) --- */}
            {/* ========================================================================= */}
            <Modal 
              opened={isModalOpen} 
              onClose={cerrarModal} 
              title={<Title order={3} fw={800}>🏫 {escuelaEditar ? "Editar Escuela" : "Registrar Nueva Escuela"}</Title>}
              size="lg"
              radius="lg"
              centered
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    <TextInput 
                        label="Nombre de la Escuela"
                        placeholder="Ej. Benito Juárez, Sor Juana Inés..."
                        required
                        {...register('nombre', { required: "El nombre es obligatorio" })}
                        error={errors.nombre?.message}
                        size="md"
                    />

                    <SimpleGrid cols={2} spacing="xs">
                      <TextInput 
                        label="Clave de Centro de Trabajo (CCT)"
                        placeholder="10 caracteres"
                        required
                        {...register('cct', { required: "El CCT es obligatorio" })}
                        error={errors.cct?.message}
                        size="md"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                      />
                      <TextInput 
                        label="Clave Estatal"
                        placeholder="Código del estado"
                        required
                        {...register('clave_estatal', { required: "La clave estatal es obligatoria" })}
                        error={errors.clave_estatal?.message}
                        size="md"
                      />
                    </SimpleGrid>

                    <SimpleGrid cols={2} spacing="xs">
                        <Controller
                            name="nivel"
                            control={control}
                            rules={{ required: "El nivel es obligatorio" }}
                            render={({ field }) => (
                                <Select
                                    label="Nivel Educativo"
                                    placeholder="Selecciona el nivel"
                                    data={NIVELES_OPCIONES}
                                    value={field.value}
                                    onChange={field.onChange}
                                    required
                                    size="md"
                                />
                            )}
                        />
                        <TextInput 
                            label="Zona Escolar"
                            placeholder="Número de zona"
                            required
                            {...register('zona', { required: "La zona es obligatoria" })}
                            error={errors.zona?.message}
                            size="md"
                        />
                    </SimpleGrid>

                    <Divider label="Ubicación Física" labelPosition="center" />

                    <SimpleGrid cols={2} spacing="xs">
                        <TextInput 
                            label="Domicilio Completo"
                            placeholder="Calle y número exterior"
                            required
                            {...register('domicilio', { required: "El domicilio es obligatorio" })}
                            error={errors.domicilio?.message}
                            size="md"
                        />
                        <TextInput 
                            label="Colonia"
                            placeholder="Nombre de la colonia"
                            required
                            {...register('colonia', { required: "La colonia es obligatoria" })}
                            error={errors.colonia?.message}
                            size="md"
                        />
                    </SimpleGrid>

                    <Paper p="sm" bg="blue.0" withBorder radius="md">
                        <Group gap="xs">
                            <AlertTriangle size={16} className="text-blue-600" />
                            <Text size="xs" c="blue.8">
                                Los datos del director y turno se pueden configurar más adelante en el perfil de la escuela.
                            </Text>
                        </Group>
                    </Paper>

                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={cerrarModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="blue" leftSection={<Save size={18} />}>
                        {escuelaEditar ? 'Guardar Cambios' : 'Registrar Escuela'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
            </Modal>

        </Stack>
    </Container>
  );
};

export default ListaEscuelas;