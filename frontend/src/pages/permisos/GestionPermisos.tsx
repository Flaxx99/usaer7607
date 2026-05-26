import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
  FileText, Plus, CheckCircle, XCircle, Clock, 
  Calendar as CalendarIcon, User, AlertCircle, Search, Settings
} from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Container, 
  Grid, 
  Paper, 
  Title, 
  Text, 
  Button, 
  Badge, 
  Group, 
  Avatar, 
  Modal, 
  Stack, 
  Loader, 
  Center,
  SimpleGrid,
  SegmentedControl,
  Box,
  Select,
  Textarea,
  NumberInput,
  ThemeIcon,
  Tooltip,
  TextInput,
  Divider,
  Table,
  ScrollArea
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';


import { getPermisos, getMetricasPermisos, createPermiso, responderPermiso, deletePermiso } from '../../api/permisos';
import type { Permiso, EstadoPermiso } from '../../interfaces/permisos';

const STATE_COLORS: Record<string, string> = {
  PENDIENTE: 'orange',
  APROBADO: 'teal',
  RECHAZADO: 'red',
};

const TIPOS_PERMISO = [
  { value: 'PERSONAL', label: 'Asuntos Personales' },
  { value: 'ENFERMEDAD', label: 'Enfermedad / Licencia Médica' },
  { value: 'COMISION', label: 'Comisión Oficial' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde (Parcial)' },
  { value: 'SALIDA_TEMPRANA', label: 'Salida Temprana (Parcial)' },
];

const GestionPermisos = () => {
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [permisoSeleccionado, setPermisoSeleccionado] = useState<Permiso | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [isAdminOrDirector, setIsAdminOrDirector] = useState(false);

    // React Hook Form para crear
    const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<Partial<Permiso>>();
    // React Hook Form para responder
    const { register: registerRes, handleSubmit: handleSubmitRes, reset: resetRes, formState: { errors: errorsRes } } = useForm<{motivo_respuesta: string}>();

    // Detectar si requiere horas (para tipos parciales)
    const tipoSeleccionado = watch('tipo');
    const esPermisoPorHoras = tipoSeleccionado === 'LLEGADA_TARDE' || tipoSeleccionado === 'SALIDA_TEMPRANA';

    // --- DETECTAR ROL ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (['ADMIN', 'DIRECTOR', 'ADMINISTRADOR'].includes(user.role)) {
                setIsAdminOrDirector(true);
            }
        }
    }, []);

    // --- QUERY: Siempre traemos todos los permisos del usuario ---
    const { data: permisos, isLoading } = useQuery({
        queryKey: ['permisos'], // Clave fija de caché para mantener los datos calientes
        queryFn: () => getPermisos({}), // Trae la lista completa permitida
    });

    const { data: metricas } = useQuery({
        queryKey: ['permisos-metricas'],
        queryFn: getMetricasPermisos,
        enabled: isAdminOrDirector
    });

    // --- FILTRADO 100% EN CLIENTE (FLUIDO E INSTANTÁNEO) ---
    const permisosFiltrados = useMemo(() => {
      if (!permisos) return [];
      return permisos.filter((p) => {
        const cumpleBusqueda = 
            (p.profesor_nombre || '').toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            (p.motivo || '').toLowerCase().includes(busquedaDebounced.toLowerCase());

        const cumpleEstado = filtroEstado === 'TODOS' || (p.estado || '').toUpperCase() === filtroEstado.toUpperCase();
        
        return cumpleBusqueda && cumpleEstado;
      });
    }, [permisos, filtroEstado, busquedaDebounced]);

    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createPermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsCreateModalOpen(false);
            reset();
            Swal.fire('Solicitud Enviada 📬', 'Tu permiso ha sido registrado y enviado a la dirección para su revisión.', 'success');
        },
        onError: (err: any) => Swal.fire('Error ❌', err.response?.data?.detail || 'Revisa las fechas. No puedes solicitar fechas pasadas.', 'error')
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, estado, respuesta }: { id: number, estado: EstadoPermiso, respuesta: string }) => 
            responderPermiso(id, estado, respuesta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            queryClient.invalidateQueries({ queryKey: ['permisos-metricas'] });
            setIsResponseModalOpen(false);
            resetRes();
            Swal.fire('¡Procesado! 👍', 'La resolución de la solicitud fue guardada y notificada.', 'success');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePermiso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permisos'] });
            Swal.fire('Cancelada 🗑️', 'Tu solicitud de permiso ha sido eliminada.', 'success');
        }
    });

    // --- HANDLERS ---
    const handleCreate = (data: Partial<Permiso>) => {
        createMutation.mutate(data);
    };

    const handleResponder = (data: { motivo_respuesta: string }, estado: EstadoPermiso) => {
        if (permisoSeleccionado) {
            respondMutation.mutate({ 
                id: permisoSeleccionado.id, 
                estado, 
                respuesta: data.motivo_respuesta 
            });
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: '¿Cancelar solicitud?',
            text: "Esta acción eliminará tu solicitud. Solo puedes cancelar solicitudes que sigan pendientes.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar'
        }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
    };

    const abrirModalRespuesta = (permiso: Permiso) => {
        setPermisoSeleccionado(permiso);
        resetRes();
        setIsResponseModalOpen(true);
    };

    const formatDate = (dateStr: string) => {
        try { return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es }); } catch { return dateStr; }
    };

    const getEstadoLabel = (estado: string) => {
        const est = (estado || 'PENDIENTE').toUpperCase();
        if (est === 'PENDIENTE') return 'En Espera';
        if (est === 'APROBADO') return 'Autorizado';
        return 'No Autorizado';
    };

    const getSafeColor = (estado: string) => {
        const est = (estado || 'PENDIENTE').toUpperCase();
        return STATE_COLORS[est] || 'gray';
    };

    if (isLoading) {
        return (
          <Container size="xl" py="md">
            <TableSkeleton rows={10} />
          </Container>
        );
    }
    
    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                
                {/* CABECERA */}
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                                <FileText size={30} />
                            </ThemeIcon>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Trámites de Permisos del Personal
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>
                                    {isAdminOrDirector 
                                        ? 'Panel de control para la revisión, autorización y rechazo de licencias del personal.' 
                                        : 'Solicita licencias por asuntos personales, enfermedad o comisiones y revisa el estatus de aprobación.'}
                                </Text>
                            </div>
                        </Group>
                        
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<Plus size={22} />} 
                            onClick={() => { reset(); setIsCreateModalOpen(true); }}
                            color="blue"
                            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                        >
                            Solicitar Nuevo Permiso
                        </Button>
                    </Group>
                </Paper>

                {/* METRICAS */}
                {isAdminOrDirector && metricas && (
                    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                        <StatBox label="En Espera" value={metricas.pendientes || 0} color="orange" icon={<Clock size={24}/>} />
                        <StatBox label="Autorizados" value={metricas.aprobados || 0} color="teal" icon={<CheckCircle size={24}/>} />
                        <StatBox label, "No Autorizados" value={metricas.rechazados || 0} color="red" icon={<XCircle size={24}/>} />
                        <StatBox label="Total Trámites" value={metricas.total || 0} color="blue" icon={<FileText size={24}/>} />
                    </SimpleGrid>
                )}

                {/* PANEL DE FILTROS Y BÚSQUEDA */}
                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <Stack gap="md">
                        <Group gap="xs">
                            <Filter size={16} className="text-blue-500" />
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>Filtros de Búsqueda Rápida</Text>
                        </Group>
                        <Grid align="flex-end">
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <TextInput 
                                    size="md"
                                    label="Buscar Solicitud"
                                    placeholder="Escribe el nombre del docente o el motivo..." 
                                    leftSection={<Search size={18} />}
                                    value={busqueda} 
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Stack gap={2}>
                                    <Text size="xs" fw={600" style={{ marginBottom: '3px' }}>Estado de la Solicitud</Text>
                                    <SegmentedControl
                                        size="md"
                                        value={filtroEstado}
                                        onChange={setFiltroEstado}
                                        data={[
                                            { label: '📂 Todos los Trámites', value: 'TODOS' },
                                            { label: '⏳ En Espera', value: 'PENDIENTE' },
                                            { label: '✅ Autorizados', value: 'APROBADO' },
                                            { label: '❌ No Autorizados', value: 'RECHAZADO' }
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

                {/* LISTA DE PERMISOS FILTRADA AL INSTANTE */}
                <Stack gap="md">

                    {permisosFiltrados.map((p) => {
                        const safeColor = getSafeColor(p.estado);
                        return (
                          <Paper 
                            key={p.id} 
                            p="lg" 
                            radius="lg" 
                            withBorder 
                            shadow="xs"
                            style={{
                              borderLeft: `6px solid var(--mantine-color-${safeColor}-filled)`
                            }}
                          >
                            <Grid align="center" gutter="md">
                              
                              {/* Sello de Estatus */}
                              <Grid.Col span={{ base: 12, sm: 3 }} style={{ borderRight: '1px solid var(--mantine-color-gray-2)', textAlign: 'center' }}>
                                <Badge 
                                  size="xl" 
                                  variant="filled" 
                                  color={safeColor}
                                  radius="md"
                                  style={{ width: '100%', height: '36px', fontSize: '0.9rem' }}
                                >
                                  {getEstadoLabel(p.estado)}
                                </Badge>
                                
                                <Box mt="md" ta="center">
                                  <ThemeIcon size="lg" radius="md" variant="light" color="gray" mb={4}>
                                    <CalendarIcon size={18} />
                                  </ThemeIcon>
                                  <Text size="xs" c="dimmed" fw={600}>INICIA EL</Text>
                                  <Text fw={900} size="md" c="gray.8">
                                    {formatDate(p.fecha_inicio)}
                                  </Text>
                                </Box>
                              </Grid.Col>

                              {/* Detalles */}
                              <Grid.Col span={{ base: 12, sm: 7 }} pl={{ sm: 'lg' }}>
                                <Stack gap="xs">
                                  <Group justify="space-between" align="flex-start">
                                    <Box>
                                      <Title order={3} fw={800} c="gray.8" style={{ fontSize: '1.3rem' }}>
                                        {p.tipo.replace('_', ' ')}
                                      </Title>
                                      <Group gap="xs" mt={2}>
                                        <Avatar color="blue" radius="xl" size="xs">
                                          {p.profesor_nombre.charAt(0)}
                                        </Avatar>
                                        <Text size="sm" fw={700} c="gray.7">
                                          {p.profesor_nombre}
                                        </Text>
                                        <Text size="xs" c="dimmed">•</Text>
                                        <Text size="xs" c="dimmed" fw={600}>{p.escuela_nombre}</Text>
                                      </Group>
                                    </Box>

                                    <Box ta="right">
                                      <Badge variant="outline" color="blue" size="md">
                                        ⏱️ {p.duracion_dias} {p.duracion_dias === 1 ? 'Día' : 'Días'}
                                      </Badge>
                                      {p.horas_solicitadas && (
                                        <Badge variant="light" color="indigo" size="md" ml={4}>
                                          ⏱️ {p.horas_solicitadas} hrs parciales
                                        </Badge>
                                      )}
                                    </Box>
                                  </Group>

                                  <Paper p="sm" bg="gray.0" radius="md" withBorder>
                                    <Text size="xs" fw={700} c="dimmed" mb={2}>MOTIVO DE LA SOLICITUD:</Text>
                                    <Text size="sm" c="gray.8" style={{ lineHeight: 1.4 }}>
                                      {p.motivo}
                                    </Text>
                                  </Paper>

                                  {p.respuesta_admin && (
                                    <Paper p="sm" bg={`${safeColor}.0`} radius="md" withBorder style={{ borderColor: `var(--mantine-color-${safeColor}-2)` }}>
                                      <Text size="xs" fw={800} c={`${safeColor}.9`} mb={2}>
                                        RESPUESTA DE DIRECCIÓN ({p.administrador_nombre}):
                                      </Text>
                                      <Text size="sm" c={`${safeColor}.9`}>
                                        {p.respuesta_admin}
                                      </Text>
                                    </Paper>
                                  )}

                                  <Text size="10px" c="dimmed" ta="right">
                                    Solicitado oficialmente el {formatDate(p.fecha_solicitud)}
                                  </Text>
                                </Stack>
                              </Grid.Col>

                              {/* Acciones */}
                              <Grid.Col span={{ base: 12, sm: 2 }} ta="center">
                                {isAdminOrDirector && (p.estado || '').toUpperCase() === 'PENDIENTE' && (
                                  <Button 
                                    size="md" 
                                    fullWidth
                                    color="dark"
                                    onClick={() => abrirModalRespuesta(p)}
                                    radius="md"
                                    leftSection={<Settings size={16} />}
                                  >
                                    Gestionar
                                  </Button>
                                )}

                                {!isAdminOrDirector && (p.estado || '').toUpperCase() === 'PENDIENTE' && (
                                  <Button 
                                    size="md" 
                                    fullWidth
                                    variant="light"
                                    color="red"
                                    onClick={() => handleDelete(p.id)}
                                    radius="md"
                                    leftSection={<XCircle size={16} />}
                                  >
                                    Cancelar
                                  </Button>
                                )}
                              </Grid.Col>

                            </Grid>
                          </Paper>
                        );
                    })}

                    {permisosFiltrados.length === 0 && (
                        <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                          <Search size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                          <Text fw={600} c="dimmed">No se encontraron trámites con este estatus.</Text>
                        </Paper>
                    )}
                </Stack>

                {/* MODAL CREAR */}
                <Modal 
                  opened={isCreateModalOpen} 
                  onClose={() => setIsCreateModalOpen(false)} 
                  title={<Title order={3} fw={800}>📋 Solicitar Licencia / Permiso</Title>}
                  size="md"
                  radius="lg"
                  centered
                >
                    <form onSubmit={handleSubmit(handleCreate)}>
                      <Stack gap="md">
                        <Controller
                          name="tipo"
                          control={control}
                          rules={{ required: "El tipo de permiso es obligatorio" }}
                          defaultValue="PERSONAL"
                          render={({ field }) => (
                            <Select
                              label="Tipo de Permiso requerido"
                              placeholder="Selecciona el motivo del trámite"
                              data={TIPOS_PERMISO}
                              value={field.value}
                              onChange={field.onChange}
                              required
                            />
                          )}
                        />

                        <SimpleGrid cols={2} spacing="xs">
                          <TextInput 
                            type="date"
                            label="Fecha de Inicio"
                            required
                            {...register('fecha_inicio', { required: "La fecha de inicio es requerida" })}
                            error={errors.fecha_inicio?.message}
                          />
                          <TextInput 
                            type="date"
                            label="Fecha de Término"
                            required
                            {...register('fecha_fin', { required: "La fecha de término es requerida" })}
                            error={errors.fecha_fin?.message}
                          />
                        </SimpleGrid>

                        {esPermisoPorHoras && (
                          <Paper p="sm" bg="blue.0" withBorder radius="md">
                            <Controller
                              name="horas_solicitadas"
                              control={control}
                              rules={{ required: esPermisoPorHoras, min: 0.5, max: 8 }}
                              render={({ field }) => (
                                <NumberInput
                                  label="Horas requeridas para el trámite parcial"
                                  description="Debe ser entre 0.5 y 8 horas."
                                  min={0.5}
                                  max={8}
                                  step={0.5}
                                  required
                                  value={field.value}
                                  onChange={field.onChange}
                                  error={errors.horas_solicitadas ? "Por favor indica las horas (0.5 a 8)" : null}
                                />
                              )}
                            />
                          </Paper>
                        )}

                        <Textarea 
                          label="Motivo detallado"
                          placeholder="Por favor explica de manera detallada el motivo de la ausencia..."
                          required
                          rows={4}
                          {...register('motivo', { required: "Debe explicar el motivo", minLength: { value: 5, message: "Mínimo 5 caracteres" } })}
                          error={errors.motivo?.message}
                        />

                        <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                          <Button variant="subtle" color="gray" onClick={() => setIsCreateModalOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" color="blue" leftSection={<Plus size={18} />}>
                            Enviar Solicitud Oficial
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                </Modal>

                {/* MODAL RESPONDER */}
                <Modal 
                  opened={isResponseModalOpen} 
                  onClose={() => setIsResponseModalOpen(false)} 
                  title={<Title order={3} fw={800}>⚖️ Resolución de Dirección</Title>}
                  radius="lg"
                  centered
                >
                    <Stack gap="md">
                        <Paper p="md" bg="gray.0" radius="md" withBorder>
                            <Text size="xs" fw={700} c="dimmed">SOLICITANTE:</Text>
                            <Text size="sm" fw={700} c="gray.8" mb="sm">
                              {permisoSeleccionado?.profesor_nombre}
                            </Text>
                            <Text size="xs" fw={700} c="dimmed">MOTIVO EXPUESTO:</Text>
                            <Text size="sm" c="gray.8" style={{ lineHeight: 1.4 }}>
                              {permisoSeleccionado?.motivo}
                            </Text>
                        </Paper>

                        <Textarea 
                          label="Respuesta / Justificación Oficial"
                          placeholder="Explica detalladamente la respuesta al docente. Esta justificación será visible en su panel..."
                          required
                          rows={4}
                          {...registerRes('motivo_respuesta', { required: "Debes ingresar una justificación oficial" })}
                          error={errorsRes.motivo_respuesta?.message}
                        />

                        <Group gap="sm" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                            <Button 
                              flex={1}
                              variant="light"
                              color="red"
                              onClick={handleSubmitRes((d) => handleResponder(d, 'RECHAZADO'))}
                              leftSection={<XCircle size={18} />}
                              size="md"
                            >
                              Rechazar Solicitud
                            </Button>
                            <Button 
                              flex={1}
                              color="teal"
                              onClick={handleSubmitRes((d) => handleResponder(d, 'APROBADO'))}
                              leftSection={<CheckCircle size={18} />}
                              size="md"
                            >
                              Autorizar Permiso
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
};

const StatBox = ({ label, value, color, icon }: any) => (
    <Paper p="md" radius="lg" withBorder shadow="xs" style={{ borderLeft: `4px solid var(--mantine-color-${color}-filled)` }}>
        <Group justify="space-between" align="center" wrap="nowrap">
            <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>{label}</Text>
                <Text size="2xl" fw={900} style={{ lineHeight: 1 }}>{value}</Text>
            </div>
            <ThemeIcon color={color} variant="light" size="lg" radius="md">
              {icon}
            </ThemeIcon>
        </Group>
    </Paper>
);

export default GestionPermisos;