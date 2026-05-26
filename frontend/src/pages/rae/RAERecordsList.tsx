import React, { useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Table, 
    Group, ActionIcon, Tooltip, TextInput, Badge, 
    ScrollArea, Divider, Box
} from '@mantine/core';
import { 
    IconSearch, IconEdit, IconFileText, IconDownload, 
    IconArrowRight, IconCheckCircle 
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { raeApi, RegistroRAE } from '../../api/rae';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';
import CustomPagination from '../../components/common/CustomPagination';

const RAERecordsList = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data: recordsData, isLoading } = useQuery({
        queryKey: ['rae_records', page],
        queryFn: () => raeApi.getMyRecords(page),
    });

    const handleExport = async (id: number) => {
        try {
            showLoading();
            const blob = await raeApi.exportExcel(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RAE_Reporte_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            notifications.show({
                title: 'Exportación Exitosa',
                message: 'El reporte RAE ha sido generado.',
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

    const filteredRecords = results.filter((r: RegistroRAE) => 
        r.escuela_nombre?.toLowerCase().includes(search.toLowerCase()) || 
        r.ciclo_nombre?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <Box 
                                p={12} 
                                radius="lg" 
                                bg="blue.6" 
                                style={{ color: 'white', boxShadow: 'var(--mantine-shadow-md)' }}
                            >
                                <IconFileText size={32} />
                            </Box>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Registros RAE
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>
                                    Registro de Atención Educativa y seguimiento de alumnos.
                                </Text>
                            </div>
                        </Group>
                    </Group>
                </Paper>

                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <Group justify="space-between" mb="md">
                        <Title order={4} fw={700}>Historial de Capturas</Title>
                        <TextInput 
                            placeholder="Buscar escuela o ciclo..." 
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
                                    <Table.Th>Escuela</Table.Th>
                                    <Table.Th>Ciclo Escolar</Table.Th>
                                    <Table.Th>Fecha Creación</Table.Th>
                                    <Table.Th>Docentes (H/M)</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {isLoading ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={5} align="center" py="xl">
                                            Cargando registros...
                                        </Table.Td>
                                    </Table.Tr>
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map((rec: RegistroRAE) => (
                                        <Table.Tr key={rec.id}>
                                            <Table.Td fw={600}>{rec.escuela_nombre || 'N/A'}</Table.Td>
                                            <Table.Td>{rec.ciclo_nombre || 'N/A'}</Table.Td>
                                            <Table.Td>{new Date(rec.fecha_creacion).toLocaleDateString()}</Table.Td>
                                            <Table.Td>
                                                <Badge variant="outline" color="blue">{rec.docente_hombres}H</Badge>
                                                <Badge variant="outline" color="pink" ml={5}>{rec.docente_mujeres}M</Badge>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Group gap={5} justify="right">
                                                    <Tooltip label="Ir a Captura">
                                                        <ActionIcon 
                                                            variant="light" 
                                                            color="blue" 
                                                            size="lg" 
                                                            radius="md"
                                                            onClick={() => navigate(`/rae/capture/${rec.id}`)}
                                                        >
                                                            <IconEdit size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Validar y Exportar">
                                                        <ActionIcon 
                                                            variant="light" 
                                                            color="green" 
                                                            size="lg" 
                                                            radius="md"
                                                            onClick={() => navigate(`/rae/validate/${rec.id}`)}
                                                        >
                                                            <IconCheckCircle size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                ) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={5} align="center" py="xl">
                                            <Text c="dimmed">No hay registros RAE disponibles.</Text>
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

export default RAERecordsList;
