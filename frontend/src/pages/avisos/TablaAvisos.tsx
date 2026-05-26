import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
    Megaphone, Plus, Calendar, Edit2, Trash2, Clock, 
    AlertCircle, User, CheckCircle, XCircle, Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
    Textarea, 
    SegmentedControl, 
    ThemeIcon, 
    Center, 
    Loader, 
    Box, 
    Divider,
    Grid,
    ActionIcon,
    Tooltip,
    SimpleGrid
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton } from '../../components/Skeletons';

// API
import { getAvisos, createAviso, updateAviso, deleteAviso } from '../../api/avisos';
import type { Anuncio } from '../../interfaces/aviso';

const TablonAvisos = () => {
  const [verMisAvisos, setVerMisAvisos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avisoEditar, setAvisoEditar] = useState<Anuncio | null>(null);


  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Anuncio>();

  // --- QUERY ---
  const { data: avisos, isLoading } = useQuery({
    queryKey: ['avisos', verMisAvisos],
    queryFn: () => getAvisos(verMisAvisos),
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      Swal.fire('Publicado 📢', 'El aviso ha sido creado y se enviarán notificaciones al personal.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.fecha_expiracion || 'Revisa los datos.';
        Swal.fire('Error ❌', String(msg), 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      cerrarModal();
      Swal.fire('Actualizado ✏️', 'Aviso modificado correctamente.', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se pudo actualizar.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAviso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      Swal.fire('Eliminado 🗑️', 'Aviso borrado del tablón.', 'success');
    }
  });

  // --- HANDLERS ---
  const cerrarModal = () => {
    setIsModalOpen(false);
    setAvisoEditar(null);
    reset();
  };

  const handleOpenCreate = () => {
    setAvisoEditar(null);
    const now = new Date().toISOString().slice(0, 16); 
    reset({ 
        fecha_publicacion: now,
        titulo: '',
        contenido: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (aviso: Anuncio) => {
    setAvisoEditar(aviso);
    const formatForInput = (isoString: string) => isoString ? isoString.slice(0, 16) : '';
    
    reset({
        ...aviso,
        fecha_publicacion: formatForInput(aviso.fecha_publicacion),
        fecha_expiracion: aviso.fecha_expiracion ? formatForInput(aviso.fecha_expiracion) : null
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: Anuncio) => {
    const envio = { ...data };

    if (!envio.fecha_expiracion || String(envio.fecha_expiracion).trim() === '') {
        envio.fecha_expiracion = null;
    }

    if (envio.fecha_publicacion && envio.fecha_publicacion.length === 16) {
        envio.fecha_publicacion = `${envio.fecha_publicacion}:00`;
    }
    
    if (envio.fecha_expiracion && envio.fecha_expiracion.length === 16) {
        envio.fecha_expiracion = `${envio.fecha_expiracion}:00`;
    }

    if (avisoEditar) {
        updateMutation.mutate({ ...envio, id: avisoEditar.id });
    } else {
        createMutation.mutate(envio);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar aviso?', 
      text: "Desaparecerá del tablón permanentemente.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, borrar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const formatDate = (dateStr: string) => {
    try {
        return format(new Date(dateStr), "d 'de' MMMM, h:mm a", { locale: es });
    } catch { return dateStr; }
  };

  const avisosFiltrados = useMemo(() => {
    if (!avisos) return [];
    return avisos.filter(aviso => {
      const cumpleBusqueda = 
        aviso.titulo.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
        aviso.contenido.toLowerCase().includes(busquedaDebounced.toLowerCase());
      return cumpleBusqueda;
    });
  }, [avisos, busquedaDebounced]);

  if (isLoading) {
      return (
        <Container size="xl" py="md">
          <CardGridSkeleton cols={6} />
        </Container>
      );
  }

  return (
    <Container size="xl" py="md">
        <Stack gap="xl">
            
            {/* ========================================================================= */}
            {/* CABECERA DEL TABLÓN */}
            {/* ========================================================================= */}
            <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                            <Megaphone size={30} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                Tablón de Avisos Oficial
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Comunicados, circulares y anuncios importantes para todo el personal de la USAER 7607.
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
                        Publicar Nuevo Aviso
                    </Button>
                </Group>
            </Paper>

            {/* ========================================================================= */}
            {/* CONTROLES DE NAVEGACIÓN Y BÚSQUEDA */}
            <Paper p="md" radius="lg" withBorder shadow="xs">
                <Stack gap="md">
                    <Group gap="xs">
                        <Filter size={16} className="text-blue-500" />
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>Filtrar Tablón</Text>
                    </Group>
                    <Grid align="flex-end">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <TextInput 
                                size="md"
                                label="Buscar Aviso"
                                placeholder="Escribe el título o contenido..." 
                                leftSection={<Search size={18} />}
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap={2}>
                                <Text size="xs" fw={600} style={{ marginBottom: '3px' }}>Vista del Tablón</Text>
                                <SegmentedControl
                                    size="md"
                                    value={verMisAvisos ? 'MIS' : 'GENERAL'}
                                    onChange={(val) => setVerMisAvisos(val === 'MIS')}
                                    data={[
                                      { label: '📢 Tablón General', value: 'GENERAL' },
                                      { label: '✏️ Mis Publicaciones', value: 'MIS' }
                                    ]}
                                    color="blue"
                                    radius="md"
                                    style={{ width: '100%' }}
                                />
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Paper>


            {/* ========================================================================= */}
            {/* REJILLA DE AVISOS (DISEÑO TIPO OFICIO) */}
            <Grid gutter="lg">
                {avisosFiltrados?.map((aviso) => {

                    const isExpired = !aviso.es_activo && aviso.fecha_expiracion;
                    const isScheduled = new Date(aviso.fecha_publicacion) > new Date();

                    return (
                        <Grid.Col key={aviso.id} span={{ base: 12, md: 6, lg: 4 }}>
                            <Paper 
                                p="lg" 
                                radius="lg" 
                                withBorder 
                                shadow="xs"
                                style={{ 
                                    borderLeft: `6px solid ${isExpired ? 'var(--mantine-color-gray-4)' : isScheduled ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-blue-6)'}`,
                                    opacity: isExpired ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                className="hover:shadow-md"
                            >
                                {/* Sello de Estado */}
                                <Box style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    {isExpired ? (
                                        <Badge color="gray" variant="filled" leftSection={<XCircle size={12} />}>Expirado</Badge>
                                    ) : isScheduled ? (
                                        <Badge color="orange" variant="filled" leftSection={<Clock size={12} />}>Programado</Badge>
                                    ) : (
                                        <Badge color="blue" variant="filled" leftSection={<CheckCircle size={12} />}>Activo</Badge>
                                    )}
                                </Box>

                                <Stack gap="xs">
                                    {/* Fecha y Título */}
                                    <Box>
                                        <Group gap="xs" mb={4}>
                                            <Calendar size={14} className="text-blue-500" />
                                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                                                {formatDate(aviso.fecha_publicacion)}
                                            </Text>
                                        </Group>
                                        <Title order={3} fw={800} c="gray.8" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                                            {aviso.titulo}
                                        </Title>
                                    </Box>

                                    <Divider my="xs" />

                                    {/* Contenido */}
                                    <Text size="sm" c="gray.7" style={{ lineHeight: 1.6, minHeight: '80px' }}>
                                        {aviso.contenido}
                                    </Text>

                                    {/* Footer: Autor y Acciones */}
                                    <Group justify="space-between" align="flex-end" mt="auto" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}>
                                        <Group gap="xs">
                                            <Avatar color="blue" radius="xl" size="sm">
                                                {aviso.autor_nombre.charAt(0)}
                                            </Avatar>
                                            <Stack gap={0}>
                                                <Text size="xs" fw={700} c="gray.8">{aviso.autor_nombre}</Text>
                                                <Text size="10px" c="dimmed">Autor del aviso</Text>
                                            </Stack>
                                        </Group>

                                        {verMisAvisos && (
                                            <Group gap={4}>
                                                <Tooltip label="Editar aviso">
                                                    <ActionIcon variant="light" color="blue" radius="md" onClick={() => handleOpenEdit(aviso)}>
                                                        <Edit2 size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Eliminar aviso">
                                                    <ActionIcon variant="light" color="red" radius="md" onClick={() => handleDelete(aviso.id)}>
                                                        <Trash2 size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        )}
                                    </Group>
                                </Stack>
                            </Paper>
                        </Grid.Col>
                    );
                })}

                {avisos?.length === 0 && (
                    <Grid.Col span={12}>
                        <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                          <Megaphone size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                          <Text fw={600} c="dimmed">No hay avisos publicados en esta sección.</Text>
                        </Paper>
                    </Grid.Col>
                )}
            </Grid>

            {/* ========================================================================= */}
            {/* --- MODAL CREAR/EDITAR AVISO (FORMULARIO ESCOLAR) --- */}
            {/* ========================================================================= */}
            <Modal 
              opened={isModalOpen} 
              onClose={cerrarModal} 
              title={<Title order={3} fw={800}>📝 {avisoEditar ? "Editar Comunicado" : "Nuevo Comunicado Oficial"}</Title>}
              size="lg"
              radius="lg"
              centered
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    <TextInput 
                        label="Título del Aviso"
                        placeholder="Ej. Suspensión de labores, Junta de Consejo..."
                        required
                        {...register('titulo', { required: "El título es obligatorio" })}
                        error={errors.titulo?.message}
                        size="md"
                    />

                    <Textarea 
                        label="Contenido del Comunicado"
                        placeholder="Detalle la información relevante para el personal. Sea claro y conciso..."
                        required
                        rows={6}
                        autosize
                        minRows={4}
                        {...register('contenido', { required: "El contenido es obligatorio" })}
                        error={errors.contenido?.message}
                        size="md"
                    />

                    <SimpleGrid cols={2} spacing="xs">
                      <Controller
                        name="fecha_publicacion"
                        control={control}
                        rules={{ required: "La fecha de publicación es requerida" }}
                        render={({ field }) => (
                            <TextInput 
                                type="datetime-local"
                                label="Fecha de Publicación"
                                required
                                value={field.value ? String(field.value) : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                error={errors.fecha_publicacion?.message}
                                size="md"
                            />
                        )}
                      />
                      <Controller
                        name="fecha_expiracion"
                        control={control}
                        render={({ field }) => (
                            <TextInput 
                                type="datetime-local"
                                label="Fecha de Expiración (Opcional)"
                                description="El aviso se ocultará automáticamente después de esta fecha."
                                value={field.value ? String(field.value) : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                size="md"
                            />
                        )}
                      />
                    </SimpleGrid>

                    <Paper p="sm" bg="blue.0" withBorder radius="md">
                        <Group gap="xs">
                            <AlertCircle size={16} className="text-blue-600" />
                            <Text size="xs" c="blue.8">
                                Al publicar, se enviará una notificación automática a todos los usuarios activos del sistema.
                            </Text>
                        </Group>
                    </Paper>

                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={cerrarModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="blue" leftSection={<Megaphone size={18} />}>
                        {avisoEditar ? 'Actualizar Aviso' : 'Publicar Comunicado'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
            </Modal>

        </Stack>
    </Container>
  );
};

export default TablonAvisos;