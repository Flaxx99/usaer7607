import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
    Plus, Calendar, Edit2, Trash2, CheckCircle, AlertTriangle, Layers, ArrowRightCircle,
    GraduationCap, TrendingUp, RefreshCw, Save
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
    Progress
} from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import 'dayjs/locale/es';
import { TableSkeleton } from '../../components/Skeletons';
import { useLoading } from '../../context/LoadingContext';

import { 
    getCiclos, createCiclo, updateCiclo, deleteCiclo, 
    previewPromocion, ejecutarPromocion, getPromocionStatus
} from '../../api/ciclos';

import type { CicloEscolar } from '../../interfaces/ciclo';

const ListaCiclos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cicloEditar, setCicloEditar] = useState<CicloEscolar | null>(null);
  const [isPromocionOpen, setIsPromocionOpen] = useState(false);
  const [promotionTaskId, setPromotionTaskId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { showLoading, hideLoading } = useLoading();
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<CicloEscolar>();

  const { data: ciclos, isLoading } = useQuery({
    queryKey: ['ciclos'],
    queryFn: getCiclos,
  });

  const { data: previewData, isLoading: loadingPreview, isError: errorPreview, refetch: refetchPreview } = useQuery({
    queryKey: ['promocionPreview'],
    queryFn: previewPromocion,
    enabled: isPromocionOpen,
    retry: false
  });

  // --- POLLING DE ESTADO DE PROMOCIÓN ---
  const { data: promotionStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['promocionStatus', promotionTaskId],
    queryFn: () => getPromocionStatus(promotionTaskId!),
    enabled: !!promotionTaskId,
    refetchInterval: (data) => (data?.status === 'PROCESSING' ? 2000 : false),
  });

  const createMutation = useMutation({
    mutationFn: createCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      Swal.fire('¡Guardado! 📅', 'El ciclo escolar ha sido registrado.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.non_field_errors || 'Revisa las fechas.';
        Swal.fire('Error ❌', String(msg), 'error');
    },
    onSettled: () => hideLoading()
  });

  const updateMutation = useMutation({
    mutationFn: updateCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      cerrarModal();
      if (isModalOpen) Swal.fire('¡Actualizado! ✏️', 'Datos actualizados.', 'success');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.non_field_errors || 'No se pudo actualizar.';
        Swal.fire('Error ❌', String(msg), 'error');
    },
    onSettled: () => hideLoading()
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCiclo,
    onMutate: () => showLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclos'] });
      Swal.fire('¡Eliminado! 🗑️', 'El ciclo ha sido borrado.', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se puede eliminar este ciclo.', 'error'),
    onSettled: () => hideLoading()
  });

  const ejecutarPromocionMutation = useMutation({
    mutationFn: ejecutarPromocion,
    onMutate: () => showLoading(),
    onSuccess: (data) => {
        // Si el backend ya es asíncrono, devolverá un taskId
        if (data.task_id) {
            setPromotionTaskId(data.task_id);
        } else {
            // Si es respuesta inmediata (síncrona), cerramos y mostramos éxito
            setIsPromocionOpen(false);
            setPromotionTaskId(null);
            queryClient.invalidateQueries({ queryKey: ['alumnos'] }); 
            Swal.fire({
                title: '¡Promoción Exitosa! 🎓',
                html: `
                    <div class="text-left text-sm">
                        <p><strong>Alumnos promovidos:</strong> ${data.promovidos}</p>
                        <p><strong>Alumnos graduados (Baja):</strong> ${data.graduados}</p>
                    </div>
                `,
                icon: 'success'
            });
        }
    },
    onError: () => Swal.fire('Error ❌', 'Hubo un problema al iniciar la promoción.', 'error'),
    onSettled: () => hideLoading()
  });

  // Efecto para manejar el final de la tarea asíncrona
  useEffect(() => {
    if (promotionStatus?.status === 'COMPLETED') {
        setIsPromocionOpen(false);
        setPromotionTaskId(null);
        queryClient.invalidateQueries({ queryKey: ['alumnos'] }); 
        Swal.fire({
            title: '¡Promoción Exitosa! 🎓',
            html: `
                <div class="text-left text-sm">
                    <p><strong>Alumnos promovidos:</strong> ${promotionStatus.data?.promovidos}</p>
                    <p><strong>Alumnos graduados (Baja):</strong> ${promotionStatus.data?.graduados}</p>
                </div>
            `,
            icon: 'success'
        });
    } else if (promotionStatus?.status === 'FAILED') {
        setIsPromocionOpen(false);
        setPromotionTaskId(null);
        Swal.fire('Error ❌', promotionStatus.error || 'La promoción falló durante el proceso.', 'error');
    }
  }, [promotionStatus, queryClient]);

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

  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const fechasInvalidas = fechaInicio && fechaFin && fechaInicio > fechaFin;

  if (isLoading) {
      return (
        <Container size="xl" py="md">
          <TableSkeleton rows={5} />
        </Container>
      );
  }

  return (
    <Container size="xl" py="md">
        <Stack gap="xl">
            
            <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                            <Layers size={30} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                Ciclos Escolares
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Define los periodos de trabajo y gestiona el ciclo vigente.
                            </Text>
                        </div>
                    </Group>
                    
                    <Group gap="xs">
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<TrendingUp size={20} />} 
                            onClick={() => setIsPromocionOpen(true)}
                            color="green"
                            variant="light"
                        >
                            Promoción de Grado
                        </Button>
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<Plus size={22} />} 
                            onClick={handleOpenCreate}
                            color="blue"
                            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                        >
                            Nuevo Ciclo
                        </Button>
                    </Group>
                </Group>
            </Paper>

            <Stack gap="md">
                {ciclos?.map((ciclo) => (
                    <Paper 
                        key={ciclo.id}
                        p="lg" 
                        radius="lg" 
                        withBorder 
                        shadow={ciclo.activo ? 'md' : 'xs'}
                        bg={ciclo.activo ? 'blue.0' : 'white'}
                        style={{ 
                            borderLeft: `6px solid ${ciclo.activo ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-3)'}`,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Group justify="space-between" align="center" wrap="wrap" gap="md">
                            <Group gap="md" align="center">
                                <ThemeIcon 
                                    size={56} 
                                    radius="xl" 
                                    color={ciclo.activo ? 'blue' : 'gray'} 
                                    variant={ciclo.activo ? 'filled' : 'light'}
                                >
                                    <Calendar size={28} />
                                </ThemeIcon>
                                <div>
                                    <Title order={3} fw={800} c={ciclo.activo ? 'blue.8' : 'gray.8'} style={{ fontSize: '1.3rem', lineHeight: 1.2 }}>
                                        {ciclo.nombre}
                                        {ciclo.activo && (
                                            <Badge color="blue" variant="filled" size="sm" ml="sm" fw={700} leftSection={<CheckCircle size={12} />}>
                                                VIGENTE
                                            </Badge>
                                        )}
                                    </Title>
                                    <Group gap="xs" mt={4}>
                                        <Text size="sm" c="dimmed" fw={600} style={{ fontFamily: 'monospace' }}>
                                            {ciclo.fecha_inicio}
                                        </Text>
                                        <ArrowRightCircle size={14} color="var(--mantine-color-gray-4)" />
                                        <Text size="sm" c="dimmed" fw={600} style={{ fontFamily: 'monospace' }}>
                                            {ciclo.fecha_fin}
                                        </Text>
                                    </Group>
                                </div>
                            </Group>

                            <Group gap="xs">
                                {!ciclo.activo && (
                                    <Button 
                                        variant="outline" 
                                        color="blue" 
                                        size="md" 
                                        leftSection={<CheckCircle size={16} />}
                                        onClick={() => handleActivarCiclo(ciclo)}
                                    >
                                        Activar
                                    </Button>
                                )}
                                <Tooltip label="Editar ciclo">
                                    <ActionIcon 
                                        variant="light" 
                                        color="blue" 
                                        size="lg" 
                                        radius="md"
                                        onClick={() => handleOpenEdit(ciclo)}
                                    >
                                        <Edit2 size={18} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Eliminar ciclo">
                                    <ActionIcon 
                                        variant="light" 
                                        color="red" 
                                        size="lg" 
                                        radius="md"
                                        onClick={() => handleDelete(ciclo.id)}
                                    >
                                        <Trash2 size={18} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Group>
                    </Paper>
                ))}

                {ciclos?.length === 0 && (
                    <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                        <AlertTriangle size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                        <Text fw={600} c="dimmed">No hay ciclos escolares registrados.</Text>
                    </Paper>
                )}
            </Stack>

            <Modal 
              opened={isModalOpen} 
              onClose={cerrarModal} 
              title={<Title order={3} fw={800}>📅 {cicloEditar ? "Editar Ciclo" : "Nuevo Ciclo Escolar"}</Title>}
              size="md"
              radius="lg"
              centered
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    <TextInput 
                        label="Nombre del Ciclo"
                        placeholder="Ej. 2024-2025"
                        required
                        {...register('nombre', { required: "El nombre es obligatorio" })}
                        error={errors.nombre?.message}
                        size="md"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    />

                    <SimpleGrid cols={2} spacing="md">
                        <Controller
                            name="fecha_inicio"
                            control={control}
                            rules={{ required: "La fecha de inicio es obligatoria" }}
                            render={({ field }) => (
                                <DatePickerInput
                                    label="Fecha de Inicio"
                                    placeholder="Selecciona fecha"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(val) => field.onChange(val ? val.toISOString().split('T')[0] : '')}
                                    error={errors.fecha_inicio?.message}
                                    size="md"
                                    locale="es"
                                    valueFormat="DD [de] MMMM [de] YYYY"
                                />
                            )}
                        />
                        <Controller
                            name="fecha_fin"
                            control={control}
                            rules={{ required: "La fecha de fin es obligatoria" }}
                            render={({ field }) => (
                                <DatePickerInput
                                    label="Fecha de Fin"
                                    placeholder="Selecciona fecha"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(val) => field.onChange(val ? val.toISOString().split('T')[0] : '')}
                                    error={errors.fecha_fin?.message}
                                    size="md"
                                    locale="es"
                                    valueFormat="DD [de] MMMM [de] YYYY"
                                />
                            )}
                        />
                    </SimpleGrid>

                    {fechasInvalidas && (
                        <Alert icon={<AlertTriangle size={16} />} color="red" title="Error de fechas" radius="md">
                            La fecha de inicio debe ser anterior a la fecha de fin.
                        </Alert>
                    )}

                    {!cicloEditar && (
                        <Paper p="sm" bg="yellow.0" withBorder radius="md">
                            <Checkbox 
                                label={
                                    <div>
                                        <Text fw={700} size="sm">Marcar como Ciclo Activo</Text>
                                        <Text size="xs" c="dimmed">Al guardar, el sistema desactivará cualquier otro ciclo vigente.</Text>
                                    </div>
                                }
                                {...register('activo')}
                                size="md"
                            />
                        </Paper>
                    )}

                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={cerrarModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="blue" leftSection={<Save size={18} />}>
                        {cicloEditar ? 'Actualizar Ciclo' : 'Guardar Ciclo'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
            </Modal>

            <Modal 
              opened={isPromocionOpen} 
              onClose={() => setIsPromocionOpen(false)} 
              title={<Title order={3} fw={800}>🎓 Simulación de Cierre de Ciclo</Title>}
              size="lg"
              radius="lg"
              centered
            >
                <Stack gap="md">
                    <Alert icon={<TrendingUp size={18} />} color="blue" title="¿Qué hace esta herramienta?" radius="md">
                        <Stack gap={4} mt={4}>
                            <Text size="sm">• Avanza de grado a los alumnos activos (ej. 1° → 2°).</Text>
                            <Text size="sm">• Gradúa (da de baja) a los que terminan nivel (ej. 6° Primaria → Egresado).</Text>
                            <Text size="sm">• No afecta a alumnos inactivos o dados de baja anteriormente.</Text>
                        </Stack>
                    </Alert>

                    {loadingPreview ? (
                        <Center py="xl">
                            <Stack align="center">
                                <Loader size="xl" variant="bars" color="blue" />
                                <Text fw={600} c="dimmed">Analizando alumnos...</Text>
                            </Stack>
                        </Center>
                    ) : errorPreview ? (
                        <Alert icon={<AlertTriangle size={18} />} color="red" title="Error al cargar la simulación" radius="md">
                            <Button variant="subtle" size="xs" onClick={() => refetchPreview()} mt="xs">Reintentar</Button>
                        </Alert>
                    ) : (
                        <Stack gap="md">
                            {promotionTaskId ? (
                                <Paper p="xl" radius="lg" withBorder shadow="sm" ta="center" bg="blue.0">
                                    <Stack align="center" gap="md">
                                        <Loader size="xl" variant="circle" color="blue" />
                                        <Title order={3} fw={800} c="blue.8">Procesando Promoción...</Title>
                                        <Text size="sm" c="dimmed">
                                            Estamos actualizando los grados de los alumnos. Por favor, no cierres esta ventana.
                                        </Text>
                                        <Progress 
                                            value={promotionStatus?.progress || 0} 
                                            striped 
                                            animated 
                                            color="blue" 
                                            radius="xl" 
                                            w="100%" 
                                            h="md"
                                        />
                                        <Text size="xs" fw={700} c="blue.6">
                                            Estado: {promotionStatus?.status || 'Sincronizando...'}
                                        </Text>
                                    </Stack>
                                </Paper>
                            ) : (
                                <SimpleGrid cols={3} spacing="md">
                                    <Paper p="lg" radius="lg" withBorder shadow="xs" ta="center" bg="blue.0">
                                        <ThemeIcon size={48} radius="xl" color="blue" variant="light" mb="sm">
                                            <TrendingUp size={24} />
                                        </ThemeIcon>
                                        <Title order={2} fw={900} c="blue.8">{previewData?.a_promover_count}</Title>
                                        <Text size="sm" fw={600} c="blue.7">Serán Promovidos</Text>
                                        <Text size="xs" c="dimmed">Pasan al siguiente grado</Text>
                                    </Paper>
                                    <Paper p="lg" radius="lg" withBorder shadow="xs" ta="center" bg="green.0">
                                        <ThemeIcon size={48} radius="xl" color="green" variant="light" mb="sm">
                                            <GraduationCap size={24} />
                                        </ThemeIcon>
                                        <Title order={2} fw={900} c="green.8">{previewData?.a_graduar_count}</Title>
                                        <Text size="sm" fw={600} c="green.7">Serán Graduados</Text>
                                        <Text size="xs" c="dimmed">Egresan del nivel</Text>
                                    </Paper>
                                    <Paper p="lg" radius="lg" withBorder shadow="xs" ta="center" bg="gray.0">
                                        <ThemeIcon size={48} radius="xl" color="gray" variant="light" mb="sm">
                                            <CheckCircle size={24} />
                                        </ThemeIcon>
                                        <Title order={2} fw={900} c="gray.8">{previewData?.total_activos}</Title>
                                        <Text size="sm" fw={600} c="gray.7">Total Analizados</Text>
                                        <Text size="xs" c="dimmed">Alumnos activos hoy</Text>
                                    </Paper>
                                </SimpleGrid>
                            )}
                        </Stack>
                    )}

                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={() => setIsPromocionOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        color="red" 
                        leftSection={<TrendingUp size={18} />}
                        onClick={handleConfirmarPromocion}
                        disabled={loadingPreview || !!errorPreview || ejecutarPromocionMutation.isPending || !!promotionTaskId}
                        loading={ejecutarPromocionMutation.isPending}
                      >
                        Ejecutar Cierre y Promoción
                      </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    </Container>
  );
};

export default ListaCiclos;