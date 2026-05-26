import React, { useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Table, 
    Group, ActionIcon, Badge, ScrollArea, Divider, Center, Loader
} from '@mantine/core';
import { 
    IconCheck, IconArrowLeft, IconDownload, IconEye, IconAlertCircle 
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { raeApi, RAEAlumno } from '../../api/rae';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';

const RAEValidationPanel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();
    const [selectedTotal, setSelectedTotal] = useState<{ field: string, value: boolean } | null>(null);

    const { data: initData, isLoading } = useQuery({
        queryKey: ['rae_capture', id],
        queryFn: raeApi.initCapture,
        enabled: !!id,
    });

    const handleExport = async () => {
        try {
            showLoading();
            const blob = await raeApi.exportExcel(Number(id));
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RAE_Oficial_${initData?.escuela}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            notifications.show({
                title: 'Documento Generado',
                message: 'El archivo oficial RAE ha sido descargado.',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'No se pudo generar el archivo.',
                color: 'red',
            });
        } finally {
            hideLoading();
        }
    };

    const calculateTotal = (field: keyof RAEAlumno) => {
        return initData?.alumnos.filter(a => a[field] === true).length || 0;
    };

    const getAlumnosForField = (field: keyof RAEAlumno) => {
        return initData?.alumnos.filter(a => a[field] === true) || [];
    };

    const categories = [
        { label: 'Discapacidad', fields: ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm'] },
        { label: 'Dificultades', fields: ['dsc', 'dsco', 'dsa'] },
        { label: 'Sobr.', fields: ['asi', 'asc', 'ass', 'asa', 'asp', 'ot'] },
        { label: 'Apoyos', fields: ['psicologia', 'comunicacion', 'psicomotricidad', 'trabajo_social', 'aprendizaje'] },
        { label: 'Portafolio', fields: ['diagnostico', 'educativo', 'deteccion', 'psicopedagogico', 'plan', 'modelo'] },
    ];

    if (isLoading) return <Center h="70vh"><Loader size="xl" /></Center>;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Button variant="subtle" color="gray" onClick={() => navigate('/rae/capture/' + id)} leftSection={<IconArrowLeft size={18} />}>
                            Volver a Captura
                        </Button>
                        <Title order={2} fw={900}>Validación de Totales RAE</Title>
                    </Group>
                    <Button color="green" size="lg" leftSection={<IconDownload size={20} />} onClick={handleExport}>
                        Descargar Archivo Oficial
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {categories.map(cat => (
                        <Paper key={cat.label} p="md" radius="lg" withBorder shadow="xs">
                            <Title order={4} fw={700} mb="md" c="blue.8">{cat.label}</Title>
                            <Divider mb="md" />
                            <Stack gap="xs">
                                {cat.fields.map(f => {
                                    const total = calculateTotal(f);
                                    return (
                                        <Group key={f} justify="space-between" p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
                                            <Text size="sm" fw={500}>{f.toUpperCase()}</Text>
                                            <Badge 
                                                color="blue" 
                                                variant="filled" 
                                                onClick={() => setSelectedTotal({ field: f, value: true })}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {total} alumnos
                                            </Badge>
                                        </Group>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    ))}
                </SimpleGrid>

                {selectedTotal && (
                    <Paper p="xl" radius="lg" withBorder shadow="md" bg="gray.0">
                        <Group justify="space-between" mb="md">
                            <Title order={3} fw={700}>Alumnos con {selectedTotal.field.toUpperCase()}</Title>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedTotal(null)}><IconCheck size={20} /></ActionIcon>
                        </Group>
                        <Divider mb="md" />
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                            {getAlumnosForField(selectedTotal.field).map(a => (
                                <Paper key={a.id} p="xs" withBorder radius="md" bg="white">
                                    <Text size="sm" fw={600}>{a.alumno_nombre}</Text>
                                    <Text size="xs" c="dimmed">{a.grado}</Text>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
};

export default RAEValidationPanel;
