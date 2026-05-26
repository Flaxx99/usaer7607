import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, MapPin, Search } from 'lucide-react';
import { getHistorialAsistencia } from '../../api/asistencia';
import { 
    Container, 
    Stack, 
    Paper, 
    Title, 
    Text, 
    Badge, 
    Group, 
    ThemeIcon, 
    Center, 
    Loader, 
    Table, 
    ScrollArea,
    rem,
    TextInput,
    Box
} from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import 'dayjs/locale/es';
import { TableSkeleton } from '../../components/Skeletons';

const HistorialAsistencia = () => {
    const [fechaFiltro, setFechaFiltro] = useState<string | null>(null);

    const { data: asistencias, isLoading } = useQuery({
        queryKey: ['asistencias', fechaFiltro],
        queryFn: () => getHistorialAsistencia(fechaFiltro ? { fecha: fechaFiltro } : {}),
    });

    return (
        <DatesProvider settings={{ locale: 'es' }}>
            <Container size="xl" py="md">
                <Stack gap="xl">
                    
                    {/* ========================================================================= */}
                    {/* CABECERA */}
                    {/* ========================================================================= */}
                    <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="md">
                            <Group gap="md">
                                <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                                    <Clock size={30} />
                                </ThemeIcon>
                                <div>
                                    <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                        Historial de Asistencia
                                    </Title>
                                    <Text size="sm" c="dimmed" fw={500}>
                                        Consulta tus registros de entrada y salida.
                                    </Text>
                                </div>
                            </Group>
                            
                            {/* Filtro Fecha */}
                            <Box w={{ base: '100%', sm: 'auto' }}>
                                <DatePickerInput
                                    placeholder="Filtrar por fecha"
                                    leftSection={<Calendar size={16} />}
                                    value={fechaFiltro ? new Date(fechaFiltro) : null}
                                    onChange={(val) => setFechaFiltro(val ? val.toISOString().split('T')[0] : null)}
                                    clearable
                                    size="md"
                                    locale="es"
                                    valueFormat="DD [de] MMMM [de] YYYY"
                                    style={{ minWidth: '220px' }}
                                />
                            </Box>
                        </Group>
                    </Paper>

                    {/* ========================================================================= */}
                    {/* TABLA DE ASISTENCIA */}
                    {/* ========================================================================= */}
                    <Paper radius="lg" withBorder shadow="xs" overflow="hidden">
                        {isLoading ? (
                            <TableSkeleton rows={10} />
                        ) : (
                            <ScrollArea>
                                <Table striped highlightOnHover horizontalSpacing="md" verticalSpacing="sm" fontSize="md">
                                    <Table.Thead bg="gray.0">
                                        <Table.Tr>
                                            <Table.Th>Fecha</Table.H>
                                            <Table.Th>Escuela / Profesor</Table.Th>
                                            <Table.Th ta="center">Entrada</Table.Th>
                                            <Table.Th ta="center">Salida</Table.Th>
                                            <Table.Th ta="center">Estado</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {asistencias?.map((asis) => (
                                            <Table.Tr key={asis.id}>
                                                <Table.Td>
                                                    <Text fw={700} size="sm" c="gray.8">{asis.fecha}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <MapPin size={14} color="var(--mantine-color-gray-5)" />
                                                        <Text size="sm" c="gray.7" fw={500}>{asis.escuela_nombre}</Text>
                                                    </Group>
                                                    <Text size="xs" c="dimmed" ml="lg">{asis.profesor_nombre}</Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Text size="sm" fw={700} c="green.7" style={{ fontFamily: 'monospace' }}>
                                                        {asis.hora_entrada}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Text size="sm" fw={700} c="blue.7" style={{ fontFamily: 'monospace' }}>
                                                        {asis.hora_salida || '--:--'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    {asis.hora_salida ? (
                                                        <Badge color="gray" variant="light" size="md" fw={700}>
                                                            COMPLETO
                                                        </Badge>
                                                    ) : (
                                                        <Badge color="orange" variant="light" size="md" fw={700}>
                                                            EN CURSO
                                                        </Badge>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        )}
                        
                        {!isLoading && asistencias?.length === 0 && (
                            <Center py="xl">
                                <Stack align="center">
                                    <Clock size={48} color="var(--mantine-color-gray-4)" />
                                    <Text fw={600} c="dimmed">No hay registros de asistencia para este periodo.</Text>
                                </Stack>
                            </Center>
                        )}
                    </Paper>

                </Stack>
            </Container>
        </DatesProvider>
    );
};

export default HistorialAsistencia;