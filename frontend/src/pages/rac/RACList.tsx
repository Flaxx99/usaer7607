import React, { useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Table, 
    Group, ActionIcon, Tooltip, TextInput, Badge, 
    SimpleGrid, Box, Divider, ScrollArea, Loader, Avatar
} from '@mantine/core';
import { 
    IconSearch, IconEdit, IconFileText, IconPlus, 
    IconDownload, IconUser, IconCalendar 
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { racApi, RegistroRAC } from '../../api/rac';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';
import CustomPagination from '../../components/common/CustomPagination';

const RACList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data: recordsData, isLoading } = useQuery({
        queryKey: ['rac_records', page],
        queryFn: () => racApi.getRecords(page),
    });

    const handleExport = async () => {
        try {
            showLoading();
            const blob = await racApi.exportGlobal();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RAC_Concentrado_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            notifications.show({
                title: 'Exportación Exitosa',
                message: 'El concentrado RAC ha sido generado.',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error de Exportación',
                message: 'No se pudo generar el archivo Excel.',
                color: 'red',
            });
        } finally {
            hideLoading();
        }
    };

    const results = recordsData?.results || [];
    const totalCount = recordsData?.count || 0;

    const filteredRecords = results.filter((r: RegistroRAC) => 
        r.alumno_nombre?.toLowerCase().includes(search.toLowerCase()) || 
        r.curp?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="indigo.0" style={{ borderLeft: '8px solid var(--mantine-color-indigo-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <Box 
                                p={12} 
                                radius="lg" 
                                bg="indigo.6" 
                                style={{ color: 'white', boxShadow: 'var(--mantine-shadow-md)' }}
                            >
                                <IconFileText size={32} />
                            </Box>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Registros RAC
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>
                                    Registro de Alumnos con Discapacidad o Aptitudes Sobresalientes.
                                </Text>
                            </div>
                        </Group>
                        
                        <Group gap="xs">
                            <Button 
                                variant="light" 
                                color="indigo" 
                                leftSection={<IconDownload size={20} />} 
                                onClick={handleExport}
                            >
                                Exportar Concentrado
                            </Button>
                            <Button 
                                size="lg" 
                                radius="md" 
                                leftSection={<IconPlus size={22} />} 
                                onClick={() => navigate('/rac/nuevo')}
                                color="indigo"
                                style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                            >
                                Nuevo Registro
                            </Button>
                        </Group>
                    </Group>
                </Paper>

                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <Group justify="space-between" mb="md">
                        <Title order={4} fw={700}>Listado de Registros</Title>
                        <TextInput 
                            placeholder="Buscar alumno o CURP..." 
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            style={{ width: 300 }}
                        />
                    </Group>

                    <Divider mb="md" />

                    <ScrollArea>
                        <Table verticalSpacing="sm" highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Alumno</Table.Th>
                                    <Table.Th>CURP</Table.Th>
                                    <Table.Th>Clasificación</Table.Th>
                                    <Table.Th>Subclasificación</Table.Th>
                                    <Table.Th>Maestro de Apoyo</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {isLoading ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={6} align="center" py="xl">
                                            <Loader size="sm" /> Cargando registros...
                                        </Table.Td>
                                    </Table.Tr>
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map((rec: RegistroRAC) => (
                                        <Table.Tr key={rec.id}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Avatar size="sm" radius="xl" color="indigo">{rec.alumno_nombre?.[0]}</Avatar>
                                                    <Text fw={600}>{rec.alumno_nombre}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td style={{ fontFamily: 'monospace' }}>{rec.curp}</Table.Td>
                                            <Table.Td>
                                                <Badge variant="light" color="indigo">{rec.clasificacion}</Badge>
                                            </Table.Td>
                                            <Table.Td>{rec.subclasificacion}</Table.Td>
                                            <Table.Td>{rec.maestro_nombre}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Tooltip label="Editar Registro">
                                                    <ActionIcon 
                                                        variant="light" 
                                                        color="indigo" 
                                                        size="lg" 
                                                        radius="md"
                                                        onClick={() => navigate(`/rac/editar/${rec.id}`)}
                                                    >
                                                        <IconEdit size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                ) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={6} align="center" py="xl">
                                            <Text c="dimmed">No se encontraron registros RAC.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>

                    <CustomPagination 
                        total={totalCount} 
                        pageSize={10} 
                        currentPage={page} 
                        onPageChange={setPage} 
                    />
                </Paper>
            </Stack>
        </Container>
    );
};

export default RACList;
