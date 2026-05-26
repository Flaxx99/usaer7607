import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { 
    AlertTriangle, CheckCircle, Clock, Plus, Search, 
    MessageSquare, User, FileText, X, Calendar
} from 'lucide-react';
import { 
    Container, 
    Grid,
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
    Select, 
    SegmentedControl, 
    ThemeIcon, 
    Center, 
    Loader, 
    Box, 
    Divider
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton } from '../../components/Skeletons';

import { getIncidencias, createIncidencia, resolverIncidencia, getMaestrosParaSelect } from '../../api/incidencias';
import type { Incidencia, IncidenciaInput } from '../../interfaces/incidencia';

const GestionIncidencias = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [resolveItem, setResolveItem] = useState<Incidencia | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);

    // --- QUERIES ---
    const { data: incidencias, isLoading } = useQuery({
        queryKey: ['incidencias'],
        queryFn: getIncidencias,
    });

    const { data: maestros } = useQuery({
        queryKey: ['maestros-select'],
        queryFn: getMaestrosParaSelect,
        enabled: isCreateOpen,
    });

    // --- FILTRADO EN CLIENTE (INSTANTÁNEO) ---
    const incidenciasFiltradas = incidencias?.filter(i => {
        const cumpleEstado = 
            filtroEstado === 'TODOS' || 
            (filtroEstado === 'PENDIENTE' && i.estado === 'PENDIENTE') ||
            (filtroEstado === 'RESUELTA' && i.estado === 'RESUELTA');
        
        const cumpleBusqueda = 
            i.titulo.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            i.profesor_nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            i.descripcion.toLowerCase().includes(busquedaDebounced.toLowerCase());

        return cumpleEstado && cumpleBusqueda;
    });

    if (isLoading) {
        return (
          <Container size="xl" py="md">
            <CardGridSkeleton cols={6} />
          </Container>
        );
    }

    };

    if (isLoading) {
        return (
          <Center h="50vh">
            <Stack align="center">
              <Loader size="xl" variant="bars" color="orange" />
              <Text fw={600} size="lg" c="orange">Cargando bitácora de incidencias...</Text>
            </Stack>
          </Center>
        );
    }

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                
                {/* ========================================================================= */}
                {/* CABECERA DE ALERTA ESCOLAR */}
                {/* ========================================================================= */}
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="orange.0" style={{ borderLeft: '8px solid var(--mantine-color-orange-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <ThemeIcon size={52} radius="lg" color="orange" variant="filled">
                                <AlertTriangle size={30} />
                            </ThemeIcon>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Bitácora de Incidencias
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>
                                    Registro oficial de situaciones escolares, accidentes o faltas de conducta.
                                </Text>
                            </div>
                        </Group>
                        
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<Plus size={22} />} 
                            onClick={() => setIsCreateOpen(true)}
                            color="orange"
                            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                        >
                            Reportar Incidencia
                        </Button>
                    </Group>
                </Paper>

                {/* ========================================================================= */}
                {/* CONTROLES DE FILTRADO Y BÚSQUEDA */}
                {/* ========================================================================= */}
                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <Grid align="flex-end" gutter="md">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Stack gap={4}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>Estado del Reporte</Text>
                                <SegmentedControl
                                    size="md"
                                    value={filtroEstado}
                                    onChange={setFiltroEstado}
                                    data={[
                                      { label: '📂 Todos', value: 'TODOS' },
                                      { label: '⏳ Pendientes', value: 'PENDIENTE' },
                                      { label: '✅ Resueltas', value: 'RESUELTA' }
                                    ]}
                                    color="orange"
                                    radius="md"
                                    style={{ width: '100%' }}
                                />
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <TextInput 
                                size="md"
                                label="Buscar en la Bitácora"
                                placeholder="Buscar por título, persona o descripción..." 
                                leftSection={<Search size={18} />}
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* ========================================================================= */}
                {/* LISTA DE TARJETAS DE INCIDENCIAS (DISEÑO LEGIBLE) */}
                {/* ========================================================================= */}
                <Stack gap="md">
                    {incidenciasFiltradas?.map((inc) => (
                        <Paper 
                          key={inc.id} 
                          p="lg" 
                          radius="lg" 
                          withBorder 
                          shadow="xs"
                          style={{
                            borderLeft: `6px solid ${inc.estado === 'PENDIENTE' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-teal-6)'}`
                          }}
                        >
                          <Group justify="space-between" align="flex-start" mb="md">
                            <Group gap="sm">
                                <Badge 
                                    size="lg" 
                                    variant="filled" 
                                    color={inc.estado === 'PENDIENTE' ? 'orange' : 'teal'}
                                    radius="md"
                                    leftSection={inc.estado === 'PENDIENTE' ? <Clock size={14} /> : <CheckCircle size={14} />}
                                >
                                    {inc.estado === 'PENDIENTE' ? 'Pendiente de Atención' : 'Caso Resuelto'}
                                </Badge>
                                <Text size="xs" c="dimmed" fw={600} style={{ marginTop: '6px' }}>
                                    {new Date(inc.fecha_reporte).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                            </Group>
                          </Group>

                          <Title order={3} fw={800} c="gray.8" mb="xs" style={{ fontSize: '1.3rem' }}>
                            {inc.titulo}
                          </Title>

                          {/* Caja de Descripción Grande y Legible */}
                          <Paper p="md" bg="gray.0" radius="md" withBorder mb="md">
                            <Text size="xs" fw={700} c="dimmed" mb={4}>DETALLES DEL REPORTE:</Text>
                            <Text size="sm" c="gray.8" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {inc.descripcion}
                            </Text>
                          </Paper>

                          <Group justify="space-between" align="flex-end">
                            <Stack gap={4}>
                                <Group gap="xs">
                                    <Avatar color="blue" radius="xl" size="sm">
                                        {inc.profesor_nombre.charAt(0)}
                                    </Avatar>
                                    <div>
                                        <Text size="xs" c="dimmed">INVOLUCRADO:</Text>
                                        <Text size="sm" fw={700} c="gray.8">{inc.profesor_nombre}</Text>
                                    </div>
                                </Group>
                                <Text size="10px" c="dimmed" ml={44}>
                                    Reportado por: {inc.reportado_por_nombre}
                                </Text>
                            </Stack>

                            {/* Botón de Acción Grande */}
                            {inc.estado === 'PENDIENTE' && (
                                <Button 
                                    size="md" 
                                    color="blue"
                                    onClick={() => setResolveItem(inc)}
                                    radius="md"
                                    leftSection={<MessageSquare size={18} />}
                                    style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
                                >
                                    Responder / Resolver
                                </Button>
                            )}
                            
                            {inc.estado === 'RESUELTA' && inc.respuesta_admin && (
                                <Box style={{ maxWidth: '300px', textAlign: 'right' }}>
                                    <Text size="xs" fw={700} c="teal.8">RESOLUCIÓN OFICIAL:</Text>
                                    <Text size="sm" c="teal.9" fw={500}>{inc.respuesta_admin}</Text>
                                </Box>
                            )}
                          </Group>
                        </Paper>
                    ))}

                    {incidenciasFiltradas?.length === 0 && (
                        <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                          <Search size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                          <Text fw={600} c="dimmed">No se encontraron reportes con estos filtros.</Text>
                        </Paper>
                    )}
                </Stack>

                {/* ========================================================================= */}
                {/* --- MODAL 1: CREAR REPORTE (FORMULARIO AMIGABLE) --- */}
                {/* ========================================================================= */}
                <Modal 
                  opened={isCreateOpen} 
                  onClose={() => setIsCreateOpen(false)} 
                  title={<Title order={3} fw={800}>🚨 Nuevo Reporte de Incidencia</Title>}
                  size="md"
                  radius="lg"
                  centered
                >
                    <form onSubmit={handleSubmitCreate(onCreateSubmit)}>
                      <Stack gap="md">
                        <TextInput 
                            label="Título del Incidente"
                            placeholder="Ej. Accidente en el recreo, Falta de respeto..."
                            required
                            {...registerCreate('titulo', { required: "El título es obligatorio" })}
                            size="md"
                        />
                        
                        <Controller
                            name="profesor"
                            control={control}
                            rules={{ required: "Debe seleccionar al involucrado" }}
                            render={({ field }) => (
                                <Select
                                    label="Profesor / Personal Involucrado"
                                    placeholder="Buscar por nombre o número de empleado..."
                                    data={maestros?.map((m: any) => ({ 
                                        value: String(m.id), 
                                        label: `${m.nombre} ${m.apellido_paterno} (${m.numero_empleado})` 
                                    })) || []}
                                    value={field.value ? String(field.value) : ''}
                                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                                    searchable
                                    required
                                    size="md"
                                />
                            )}
                        />
                        <Text size="10px" c="dimmed" mt={-8}>
                            * Si el incidente es con un alumno, seleccione al maestro del grupo a cargo.
                        </Text>

                        <Textarea 
                            label="Descripción Detallada de los Hechos"
                            placeholder="Describa qué sucedió, a qué hora, quiénes estaban presentes y qué acciones inmediatas tomó..."
                            required
                            rows={6}
                            autosize
                            minRows={4}
                            {...registerCreate('descripcion', { required: "La descripción es obligatoria" })}
                            size="md"
                        />

                        <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                          <Button variant="subtle" color="gray" onClick={() => setIsCreateOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" color="orange" leftSection={<FileText size={18} />}>
                            Guardar en Bitácora
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                </Modal>

                {/* ========================================================================= */}
                {/* --- MODAL 2: RESOLVER INCIDENCIA --- */}
                {/* ========================================================================= */}
                <Modal 
                  opened={!!resolveItem} 
                  onClose={() => setResolveItem(null)} 
                  title={<Title order={3} fw={800}>⚖️ Resolución de Incidencia</Title>}
                  radius="lg"
                  centered
                >
                    <Stack gap="md">
                        <Paper p="md" bg="orange.0" radius="md" withBorder>
                            <Text size="xs" fw={700} c="orange.9">REPORTE ORIGINAL:</Text>
                            <Title order={4} fw={800} c="orange.8" mb="xs">{resolveItem?.titulo}</Title>
                            <Text size="sm" c="orange.9" style={{ lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                              {resolveItem?.descripcion}
                            </Text>
                            <Divider my="sm" color="orange.3" />
                            <Text size="10px" c="dimmed">Involucrado: {resolveItem?.profesor_nombre} | Reportado: {resolveItem?.fecha_reporte}</Text>
                        </Paper>

                        <Textarea 
                          label="Respuesta Oficial / Acciones Tomadas"
                          placeholder="Detalle las medidas disciplinarias, administrativas o de seguimiento que se aplicaron para cerrar este caso..."
                          required
                          rows={4}
                          autosize
                          {...registerResolve('respuesta', { required: "Debe indicar cómo se resolvió el caso" })}
                          size="md"
                        />

                        <Group gap="sm" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                            <Button 
                              flex={1}
                              variant="light"
                              color="gray"
                              onClick={() => setResolveItem(null)}
                              size="md"
                            >
                              Posponer
                            </Button>
                            <Button 
                              flex={1}
                              color="teal"
                              onClick={handleSubmitResolve(onResolveSubmit)}
                              leftSection={<CheckCircle size={18} />}
                              size="md"
                            >
                              Marcar como Resuelta
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
};

export default GestionIncidencias;