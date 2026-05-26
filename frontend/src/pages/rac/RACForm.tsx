import React, { useEffect, useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Group, 
    TextInput, Select, ThemeIcon, Modal, Divider, 
    Alert, ActionIcon, Box
} from '@mantine/core';
import { 
    IconCheck, IconAlertCircle, IconArrowLeft, IconSave, IconUserCheck 
} from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { racApi, RegistroRAC } from '../../api/rac';
import { notifications } from '@mantine/notifications';
import { useLoading } from '../../context/LoadingContext';
import { getAlumnos } from '../../api/alumnos';

// --- CONSTANTES DE VALIDACIÓN (Sincronizadas con el Backend) ---
const CLASIFICACION_SUB = {
    'DISCAPACIDAD': [
        { value: 'DI', label: 'Discapacidad intelectual' },
        { value: 'DMO', label: 'Discapacidad motriz' },
        { value: 'SO', label: 'Sordera' },
        { value: 'HP', label: 'Hipoacusia' },
        { value: 'CEG', label: 'Ceguera' },
        { value: 'BV', label: 'Baja visión' },
        { value: 'DM', label: 'Discapacidad múltiple' },
        { value: 'SCG', label: 'Sordoceguera' },
        { value: 'DME', label: 'Discapacidad mental o psicosocial' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'DIFICULTADES_SEVERAS': [
        { value: 'DSC', label: 'Dificultades severas de conducta' },
        { value: 'DSCO', label: 'Dificultades severas de comunicación' },
        { value: 'DSA', label: 'Dificultades severas de aprendizaje' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'TRASTORNOS': [
        { value: 'TEA', label: 'Trastorno del espectro autista' },
        { value: 'TDAH', label: 'Trastorno por Déficit de Atención e Hiperactividad' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'APTITUDES_SOBRESALIENTES': [
        { value: 'ASI', label: 'Aptitudes sobresalientes intelectuales' },
        { value: 'ASC', label: 'Aptitudes sobresalientes creativas' },
        { value: 'ASS', label: 'Aptitudes sobresalientes socioafectivas' },
        { value: 'ASA', label: 'Aptitudes sobresalientes artísticas' },
        { value: 'ASP', label: 'Aptitudes sobresalientes psicomotrices' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
};

const CLASIFICACIONES = Object.keys(CLASIFICACION_SUB).map(k => ({ 
    value: k, 
    label: k.replace('_', ' ') 
}));

const RACForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useLoading();
    
    const [selectedAlumno, setSelectedAlumno] = useState<any>(null);

    const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
        queryKey: ['alumnos'],
        queryFn: getAlumnos,
    });

    const { data: initialData, isLoading: loadingInitial } = useQuery({
        queryKey: ['rac_record', id],
        queryFn: async () => {
            // En un entorno real, tendríamos un endpoint GET /api/rac/:id/
            // Por ahora, buscamos en la lista general para simplificar
            const records = await racApi.getRecords();
            return records.find((r: RegistroRAC) => r.id === Number(id));
        },
        enabled: !!id,
    });

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<Partial<RegistroRAC>>({
        defaultValues: {
            clasificacion: '',
            subclasificacion: '',
            observaciones: '',
        }
    });

    const currentClasificacion = watch('clasificacion');

    // Efecto para manejar la carga de datos iniciales (Edición)
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            // Buscamos el alumno para el select
            const alumno = alumnos?.find(a => a.id === initialData.alumno);
            if (alumno) setSelectedAlumno(alumno);
        }
    }, [initialData, alumnos, reset]);

    // Efecto para resetear subclasificación si cambia la clasificación
    useEffect(() => {
        setValue('subclasificacion', '');
    }, [currentClasificacion, setValue]);

    const saveMutation = useMutation({
        mutationFn: racApi.saveRecord,
        onMutate: () => showLoading(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rac_records'] });
            notifications.show({
                title: '¡Registro Guardado!',
                message: 'La información del RAC ha sido actualizada correctamente.',
                color: 'green',
            });
            navigate('/rac');
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Error al Guardar',
                message: err.response?.data?.detail || 'Ocurrió un error al procesar el registro.',
                color: 'red',
            });
        },
        onSettled: () => hideLoading(),
    });

    const onSubmit = (data: Partial<RegistroRAC>) => {
        if (!selectedAlumno) {
            notifications.show({
                title: 'Alumno Requerido',
                message: 'Debes seleccionar un alumno antes de guardar.',
                color: 'orange',
            });
            return;
        }

        const payload = {
            ...data,
            id: id ? Number(id) : undefined,
            alumno: selectedAlumno.id,
        };

        saveMutation.mutate(payload);
    };

    if (loadingAlumnos || loadingInitial) {
        return (
            <Container size="xl" py="md">
                <Center h="70vh">
                    <Stack align="center">
                        <Loader size="xl" />
                        <Text fw={600}>Cargando datos del sistema...</Text>
                    </Stack>
                </Center>
            </Container>
        );
    }

    return (
        <Container size="lg" py="md">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Button variant="subtle" color="gray" onClick={() => navigate('/rac')} leftSection={<IconArrowLeft size={18} />}>
                            Volver al Listado
                        </Button>
                        <Title order={2} fw={900}>
                            {id ? 'Editar Registro RAC' : 'Nuevo Registro RAC'}
                        </Title>
                    </Group>
                    <Button 
                        color="indigo" 
                        rightSection={<IconSave size={18} />} 
                        onClick={handleSubmit(onSubmit)}
                        loading={saveMutation.isPending}
                    >
                        Guardar Registro
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {/* SECCIÓN 1: SELECCIÓN DE ALUMNO Y DATOS AUTO-RELLENADOS */}
                    <Paper p="xl" radius="lg" withBorder shadow="sm">
                        <Stack gap="md">
                            <Group gap="xs">
                                <ThemeIcon size={32} radius="md" color="indigo">
                                    <IconUser size={20} />
                                </ThemeIcon>
                                <Title order={4} fw={700}>Información del Alumno</Title>
                            </Group>
                            <Divider />
                            
                            <Select
                                label="Seleccionar Alumno"
                                placeholder="Busca por nombre o CURP"
                                data={alumnos?.map(a => ({ value: String(a.id), label: `${a.apellido_paterno} ${a.apellido_materno}, ${a.nombre}` })) || []}
                                searchable
                                nothingFoundMessage="No se encontró ningún alumno"
                                onChange={(val) => {
                                    const alumno = alumnos?.find(a => String(a.id) === val);
                                    setSelectedAlumno(alumno || null);
                                }}
                                value={selectedAlumno?.id ? String(selectedAlumno.id) : null}
                                size="md"
                                required
                            />

                            {selectedAlumno ? (
                                <SimpleGrid cols={2} spacing="sm" mt="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', padding: 'md', borderRadius: 'var(--mantine-radius-md)' }}>
                                    <Box>
                                        <Text size="xs" c="dimmed" fw={700}>CURP</Text>
                                        <Text fw={600} size="sm">{selectedAlumno.curp || 'N/A'}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" c="dimmed" fw={700}>GÉNERO</Text>
                                        <Text fw={600} size="sm">{selectedAlumno.sexo === 'H' ? 'Hombre' : selectedAlumno.sexo === 'M' ? 'Mujer' : 'N/A'}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" c="dimmed" fw={700}>EDAD</Text>
                                        <Text fw={600} size="sm">{selectedAlumno.edad} años</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" c="dimmed" fw={700}>GRADO</Text>
                                        <Text fw={600} size="sm">{selectedAlumno.grado} {selectedAlumno.grupo}</Text>
                                    </Box>
                                </SimpleGrid>
                            ) : (
                                <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                                    Selecciona un alumno para ver sus datos básicos.
                                </Alert>
                            )}
                        </Stack>
                    </Paper>

                    {/* SECCIÓN 2: CLASIFICACIÓN TÉCNICA */}
                    <Paper p="xl" radius="lg" withBorder shadow="sm">
                        <Stack gap="md">
                            <Group gap="xs">
                                <ThemeIcon size={32} radius="md" color="indigo">
                                    <IconUserCheck size={20} />
                                </ThemeIcon>
                                <Title order={4} fw={700}>Clasificación Técnica</Title>
                            </Group>
                            <Divider />

                            <Controller
                                name="clasificacion"
                                control={control}
                                rules={{ required: "La clasificación es obligatoria" }}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        label="Clasificación"
                                        placeholder="Selecciona la categoría"
                                        data={CLASIFICACIONES}
                                        size="md"
                                        error={errors.clasificacion?.message}
                                        required
                                    />
                                )}
                            />

                            <Controller
                                name="subclasificacion"
                                control={control}
                                rules={{ required: "La subclasificación es obligatoria" }}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        label="Subclasificación"
                                        placeholder={currentClasificacion ? "Selecciona la sub-categoría" : "Primero elige una clasificación"}
                                        data={currentClasificacion ? CLASIFICACION_SUB[currentClasificacion] : []}
                                        disabled={!currentClasificacion}
                                        size="md"
                                        error={errors.subclasificacion?.message}
                                        required
                                    />
                                )}
                            />

                            <TextInput 
                                label="Observaciones" 
                                placeholder="Notas adicionales sobre la condición del alumno..."
                                {...register('observaciones')}
                                size="md"
                                multiline
                                autosize
                                minRows={3}
                            />
                        </Stack>
                    </Paper>
                </SimpleGrid>
            </Stack>
        </Container>
    );
};

export default RACForm;
