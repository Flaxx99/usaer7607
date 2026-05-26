import React, { useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Group, 
    Badge, ScrollArea, SimpleGrid, ActionIcon, Tooltip, 
    Divider, Box, ThemeIcon, Center, Loader
} from '@mantine/core';
import { 
    IconCalendar, IconPlus, IconCheck, IconClock, 
    IconAlertCircle, IconUser, IconSchool, IconTrash 
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi, CalendarEvent } from '../../api/calendar';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';
import TaskModal from './TaskModal';
import { getUsuarios } from '../../api/usuarios';
import { getAlumnos } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas';

const SchoolCalendar = () => {
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const { data: events, isLoading: loadingEvents } = useQuery({
        queryKey: ['calendar_events'],
        queryFn: calendarApi.getEvents,
    });

    const { data: users } = useQuery({ queryKey: ['users'], queryFn: getUsuarios });
    const { data: alunos } = useQuery({ queryKey: ['alumnos'], queryFn: getAlumnos });
    const { data: escuelas } = useQuery({ queryKey: ['escuelas'], queryFn: getEscuelas });

    const saveMutation = useMutation({
        mutationFn: calendarApi.saveEvent,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            setModalOpened(false);
            setEditingEvent(null);
            notifications.show({
                title: 'Calendario Actualizado',
                message: 'El evento/tarea ha sido guardado correctamente.',
                color: 'green',
            });
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Error',
                message: err.response?.data?.detail || 'No se pudo guardar el evento.',
                color: 'red',
            });
        },
        onSettled: () => hideLoading(),
    });

    const deleteMutation = useMutation({
        mutationFn: calendarApi.deleteEvent,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
            notifications.show({ title: 'Eliminado', message: 'El evento ha sido borrado.', color: 'gray' });
        },
        onSettled: () => hideLoading(),
    });

    const handleOpenCreate = () => {
        setEditingEvent(null);
        setModalOpened(true);
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        setModalOpened(true);
    };

    const handleSave = (data: Partial<CalendarEvent>) => {
        saveMutation.mutate({
            ...data,
            id: editingEvent?.id,
        });
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'ALTA': return 'red';
            case 'MEDIA': return 'yellow';
            case 'BAJA': return 'blue';
            default: return 'gray';
        }
    };

    if (loadingEvents) return <Center h="70vh"><Loader size="xl" /></Center>;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <Box p={12} radius="lg" bg="blue.6" style={{ color: 'white', boxShadow: 'var(--mantine-shadow-md)' }}>
                                <IconCalendar size={32} />
                            </Box>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Agenda y Tareas USAER
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>Gestión de actividades, evaluaciones y tareas administrativas.</Text>
                            </div>
                        </Group>
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<IconPlus size={22} />} 
                            onClick={handleOpenCreate}
                            color="blue"
                            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                        >
                            Nueva Tarea/Evento
                        </Button>
                    </Group>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {/* COLUMNA 1: TAREAS PENDIENTES CRÍTICAS */}
                    <Paper p="md" radius="lg" withBorder shadow="xs" style={{ borderTop: '4px solid red' }}>
                        <Group gap="xs" mb="md">
                            <IconAlertCircle color="red" size={20} />
                            <Title order={4} fw={700}>Urgentes (Prioridad Alta)</Title>
                        </Group>
                        <Divider mb="md" />
                        <Stack gap="sm">
                            {events?.filter(e => e.priority === 'ALTA' && e.status === 'PENDIENTE').map(e => (
                                <Paper key={e.id} p="sm" withBorder radius="md" bg="red.0" style={{ borderLeft: '3px solid red' }}>
                                    <Group justify="space-between" wrap="nowrap">
                                        <Text size="sm" fw={700} truncate>{e.title}</Text>
                                        <ActionIcon variant="subtle" color="red" onClick={() => handleOpenEdit(e)}><IconEdit size={14} /></ActionIcon>
                                    </Group>
                                    <Text size="xs" c="dimmed">{new Date(e.start_time).toLocaleDateString()}</Text>
                                </Paper>
                            ))}
                            {events?.filter(e => e.priority === 'ALTA' && e.status === 'PENDIENTE').length === 0 && (
                                <Text size="xs" c="dimmed" ta="center">No hay tareas urgentes.</Text>
                            )}
                        </Stack>
                    </Paper>

                    {/* COLUMNA 2: AGENDA DEL DÍA / SEMANA */}
                    <Paper p="md" radius="lg" withBorder shadow="xs" style={{ gridColumn: 'span 2', borderTop: '4px solid blue' }}>
                        <Group gap="xs" mb="md">
                            <IconClock color="blue" size={20} />
                            <Title order={4} fw={700}>Cronograma de Actividades</Title>
                        </Group>
                        <Divider mb="md" />
                        <ScrollArea h={600}>
                            <Table verticalSpacing="sm" highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Fecha/Hora</Table.Th>
                                        <Table.Th>Evento/Tarea</Table.Th>
                                        <Table.Th>Asignado</Table.Th>
                                        <Table.Th>Relacionado</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {events?.map(e => (
                                        <Table.Tr key={e.id}>
                                            <Table.Td>
                                                <Text size="xs" fw={600}>{new Date(e.start_time).toLocaleDateString()}</Text>
                                                <Text size="xs" c="dimmed">{new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={5}>
                                                    <Box style={{ width: 8, height: 24, backgroundColor: e.color, borderRadius: 4 }} />
                                                    <Text size="sm" fw={600}>{e.title}</Text>
                                                </Group>
                                                <Text size="xs" c="dimmed" truncate>{e.description}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge variant="light" color="gray" size="sm">{e.assigned_to_nombre || 'S/N'}</Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    {e.alumno_nombre && <Badge size="xs" color="blue" variant="outline"><IconUser size={10}/> {e.alumno_nombre}</Badge>}
                                                    {e.escuela_nombre && <Badge size="xs" color="teal" variant="outline"><IconSchool size={10}/> {e.escuela_nombre}</Badge>}
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={e.status === 'COMPLETADO' ? 'green' : e.status === 'CANCELADO' ? 'red' : 'yellow'}>
                                                    {e.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Group gap={5} justify="right">
                                                    <ActionIcon variant="light" color="blue" size="lg" radius="md" onClick={() => handleOpenEdit(e)}><IconEdit size={16} /></ActionIcon>
                                                    <ActionIcon variant="light" color="red" size="lg" radius="md" onClick={() => {
                                                        if (confirm('¿Eliminar este evento?')) deleteMutation.mutate(e.id);
                                                    }}><IconTrash size={16} /></ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </LTable>
                </Paper>
            </Stack>

            <TaskModal 
                opened={modalOpened} 
                onClose={() => { setModalOpened(false); setEditingEvent(null); }} 
                onSave={handleSave}
                initialData={editingEvent}
                users={users || []}
                alunos={alunos || []}
                escuelas={escuelas || []}
                currentUserRole={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role : ''}
            />
        </Container>
    );
};

export default SchoolCalendar;
