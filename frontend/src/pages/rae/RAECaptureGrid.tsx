import React, { useState, useEffect, useMemo } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Table, 
    Group, ActionIcon, Tooltip, Badge, ScrollArea, 
    Divider, Center, Loader, Checkbox, Box
} from '@mantine/core';
import { 
    IconSave, IconArrowLeft, IconCheck, IconAlertCircle, 
    IconUser, IconFileCheck 
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { raeApi, RAEAlumno, RAEInitResponse } from '../../api/rae';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';

// --- DEFINICIÓN DE COLUMNAS (Categorizadas) ---
const RAE_COLUMNS = {
    condiciones: {
        label: 'Condiciones',
        fields: [
            { id: 'ceg', label: 'CEG' }, { id: 'bv', label: 'BV' }, { id: 'so', label: 'SO' },
            { id: 'hp', label: 'HP' }, { id: 'scg', label: 'SCG' }, { id: 'dmo', label: 'DMO' },
            { id: 'di', label: 'DI' }, { id: 'dme', label: 'DME' }, { id: 'psicosocial', label: 'PSICO' },
            { id: 'dm', label: 'DM' },
        ]
    },
    dificultades: {
        label: 'Dificultades',
        fields: [
            { id: 'dsc', label: 'DSC' }, { id: 'dsco', label: 'DSCO' }, { id: 'dsa', label: 'DSA' },
        ]
    },
    especiales: {
        label: 'Sobr.',
        fields: [
            { id: 'asi', label: 'ASI' }, { id: 'asc', label: 'ASC' }, { id: 'ass', label: 'ASS' },
            { id: 'asa', label: 'ASA' }, { id: 'asp', label: 'ASP' }, { id: 'ot', label: 'OT' },
        ]
    },
    apoyos: {
        label: 'Apoyos',
        fields: [
            { id: 'psicologia', label: 'PSIC' }, { id: 'comunicacion', label: 'COM' }, 
            { id: 'psicomotricidad', label: 'PSICOM' }, { id: 'trabajo_social', label: 'T.SOC' }, 
            { id: 'aprendizaje', label: 'APR' },
        ]
    },
    estatus: {
        label: 'Estatus',
        fields: [
            { id: 'nuevo_ingreso', label: 'NI' }, { id: 'subsecuente', label: 'SUB' },
        ]
    },
    portafolio: {
        label: 'Portafolio',
        fields: [
            { id: 'diagnostico', label: 'DIAG' }, { id: 'educativo', label: 'EDU' }, 
            { id: 'deteccion', label: 'DET' }, { id: 'psicopedagogico', label: 'PSICOP' }, 
            { id: 'plan', label: 'PLAN' }, { id: 'modelo', label: 'MOD' },
        ]
    }
};

const RAECaptureGrid = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    
    const storageKey = `rae_drafts_${id}`;

    const [drafts, setDrafts] = useState<Record<number, Partial<RAEAlumno>>>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : {};
    });
    const [dirtyRows, setDirtyRows] = useState<Set<number>>(() => {
        const saved = localStorage.getItem(`${storageKey}_dirty`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(drafts));
    }, [drafts, storageKey]);

    useEffect(() => {
        localStorage.setItem(`${storageKey}_dirty`, JSON.stringify(Array.from(dirtyRows)));
    }, [dirtyRows, storageKey]);

    const { data: initData, isLoading } = useQuery({
        queryKey: ['rae_capture', id],
        queryFn: raeApi.initCapture,
        enabled: !!id,
    });

    const saveMutation = useMutation({
        mutationFn: (payload: { registro_id: number, alumnos: any[] }) => raeApi.saveBulk(payload),
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rae_capture', id] });
            setDrafts({});
            setDirtyRows(new Set());
            localStorage.removeItem(storageKey);
            localStorage.removeItem(`${storageKey}_dirty`);
            notifications.show({
                title: 'Datos Guardados',
                message: 'La captura de RAE ha sido sincronizada con el servidor.',
                color: 'green',
            });
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Error al Guardar',
                message: 'Hubo un problema al guardar los cambios.',
                color: 'red',
            });
        },
        onSettled: () => hideLoading(),
    });

    const handleCheckboxChange = (alumnoId: number, field: string, value: boolean) => {
        setDrafts(prev => {
            const current = prev[alumnoId] || {};
            return {
                ...prev,
                [alumnoId]: { ...current, [field]: value }
            };
        });
        setDirtyRows(prev => new Set(prev).add(alumnoId));
    };

    const handleSave = () => {
        const updates = Object.entries(drafts).map(([id, changes]) => ({
            id: Number(id),
            ...changes
        }));

        if (updates.length === 0) {
            notifications.show({ title: 'Sin cambios', message: 'No hay datos nuevos para guardar.', color: 'blue' });
            return;
        }

        saveMutation.mutate({
            registro_id: Number(id),
            alumnos: updates
        });
    };

    if (isLoading) {
        return (
            <Center h="70vh">
                <Stack align="center">
                    <Loader size="xl" />
                    <Text fw={600}>Cargando cuadrícula de captura...</Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <Button variant="subtle" color="gray" onClick={() => navigate('/rae')} leftSection={<IconArrowLeft size={18} />}>
                                Volver al Listado
                            </Button>
                            <Box>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>
                                    Captura RAE: {initData?.escuela}
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>Ciclo: {initData?.ciclo} | {initData?.alumnos.length} Alumnos</Text>
                            </Box>
                        </Group>
                        
                         <Group gap="sm">
                             <Button 
                                 variant="light" 
                                 color="gray" 
                                 onClick={() => {
                                     setDrafts({});
                                     setDirtyRows(new Set());
                                     localStorage.removeItem(storageKey);
                                     localStorage.removeItem(`${storageKey}_dirty`);
                                     notifications.show({ title: 'Borradores eliminados', message: 'Se han limpiado los cambios locales.', color: 'blue' });
                                 }}
                                 disabled={dirtyRows.size === 0}
                             >
                                 Limpiar Borradores
                             </Button>
                             <Button 
                                 color="blue" 
                                 leftSection={<IconSave size={20} />} 
                                 onClick={handleSave}
                                 loading={saveMutation.isPending}
                                 disabled={dirtyRows.size === 0}
                             >
                                 Guardar Cambios ({dirtyRows.size})
                             </Button>
                         </Group>

                    </Group>
                </Paper>

                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <Text size="xs" c="dimmed" mb="sm" fw={700} tt="uppercase">
                        Instrucciones: Marque los cuadros correspondientes. Las filas resaltadas indican cambios pendientes de guardado.
                    </Text>

                    <ScrollArea>
                        <Table verticalSpacing="sm" highlightOnHover stickyHeader>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 250, position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-gray-0)', zIndex: 10 }}>Alumno</Table.Th>
                                    {Object.entries(RAE_COLUMNS).map(([catKey, cat]) => (
                                        <Table.Th key={catKey} colSpan={cat.fields.length} align="center" bg="gray.1">
                                            {cat.label}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                                <Table.Tr>
                                    <Table.Th style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-gray-0)', zIndex: 10 }}>Nombre Completo</Table.Th>
                                    {Object.values(RAE_COLUMNS).flatMap(cat => 
                                        cat.fields.map(f => (
                                            <Table.Th key={f.id} style={{ width: 60, textAlign: 'center' }}>{f.label}</Table.Th>
                                        ))
                                    )}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {initData?.alumnos.map((alum: RAEAlumno) => {
                                    const isDirty = dirtyRows.has(alum.id);
                                    return (
                                        <Table.Tr key={alum.id} bg={isDirty ? 'yellow.0' : undefined}>
                                            <Table.Td style={{ position: 'sticky', left: 0, backgroundColor: isDirty ? 'yellow.0' : 'var(--mantine-color-gray-0)', zIndex: 10 }} fw={600}>
                                                {alum.alumno_nombre}
                                            </Table.Td>
                                            {Object.values(RAE_COLUMNS).flatMap(cat => 
                                                cat.fields.map(f => {
                                                    const val = drafts[alum.id]?.[f.id] ?? alum[f.id as keyof RAEAlumno] as boolean;
                                                    return (
                                                        <Table.Td key={f.id} align="center">
                                                            <Checkbox 
                                                                checked={!!val} 
                                                                onChange={(e) => handleCheckboxChange(alum.id, f.id, e.currentTarget.checked)}
                                                            />
                                                        </Table.Td>
                                                    );
                                                })
                                            )}
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Paper>
            </Stack>
        </Container>
    );
};

export default RAECaptureGrid;
