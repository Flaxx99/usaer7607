import React from 'react';
import { 
    Modal, TextInput, Textarea, Select, Group, Stack, 
    DateTimePicker, ColorPicker, Button 
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { CalendarEvent } from '../../api/calendar';

interface TaskModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (data: Partial<CalendarEvent>) => void;
    initialData?: CalendarEvent | null;
    users: any[]; // List of users to assign the task to
    alunos: any[]; // List of students
    escuelas: any[]; // List of schools
    currentUserRole: string;
}

const TaskModal = ({ opened, onClose, onSave, initialData, users, alunos, escuelas, currentUserRole }: TaskModalProps) => {
    const { register, handleSubmit, reset, setValue } = useForm<Partial<CalendarEvent>>({
        defaultValues: initialData || {
            event_type: 'TAREA',
            status: 'PENDIENTE',
            priority: 'MEDIA',
            color: '#3B82F6',
        }
    });

    React.useEffect(() => {
        if (initialData) reset(initialData);
    }, [initialData, reset]);

    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SECRETARIO';

    return (
        <Modal 
            opened={opened} 
            onClose={onClose} 
            title={initialData ? 'Editar Tarea/Evento' : 'Crear Nueva Tarea/Evento'}
            size="lg"
            radius="lg"
        >
            <form onSubmit={handleSubmit(onSave)}>
                <Stack gap="md">
                    <TextInput 
                        label="Título" 
                        placeholder="Ej. Revisión de expediente de Juan Pérez" 
                        {...register('title', { required: true })} 
                        required 
                    />
                    
                    <Textarea 
                        label="Descripción / Notas" 
                        placeholder="Detalles adicionales de la tarea..." 
                        {...register('description')} 
                    />

                    <SimpleGrid cols={2}>
                        <Select 
                            label="Tipo" 
                            {...register('event_type')}
                            data={[
                                { value: 'EVALUACION', label: 'Evaluación Psicopedagógica' },
                                { value: 'REUNION', label: 'Reunión con Padres' },
                                { value: 'VISITA', label: 'Visita a Escuela' },
                                { value: 'TAREA', label: 'Tarea Administrativa' },
                                { value: 'OTRO', label: 'Otro' },
                            ]} 
                        />
                        <Select 
                            label="Prioridad" 
                            {...register('priority')}
                            data={[
                                { value: 'BAJA', label: 'Baja' },
                                { value: 'MEDIA', label: 'Media' },
                                { value: 'ALTA', label: 'Alta' },
                            ]} 
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={2}>
                        <DateTimePicker 
                            label="Fecha y Hora Inicio" 
                            {...register('start_time')} 
                            required 
                        />
                        <DateTimePicker 
                            label="Fecha y Hora Fin" 
                            {...register('end_time')} 
                            required 
                        />
                    </SimpleGrid>

                    <Divider label="Asignación y Vínculos" labelPosition="center" />

                    <Group grow>
                        <Select 
                            label="Asignar a" 
                            {...register('assigned_to')}
                            data={users.map(u => ({ value: String(u.id), label: u.get_full_name() }))}
                            disabled={!isAdmin}
                            placeholder={isAdmin ? "Seleccionar responsable" : "Asignado a ti"}
                        />
                        <Select 
                            label="Estado" 
                            {...register('status')}
                            data={[
                                { value: 'PENDIENTE', label: 'Pendiente' },
                                { value: 'COMPLETADO', label: 'Completado' },
                                { value: 'CANCELADO', label: 'Cancelado' },
                            ]} 
                        />
                    </Group>

                    <SimpleGrid cols={2}>
                        <Select 
                            label="Alumno Relacionado" 
                            {...register('alumno')}
                            data={alunos?.map(a => ({ value: String(a.id), label: a.get_full_name() })) || []}
                            searchable
                        />
                        <Select 
                            label="Escuela Relacionada" 
                            {...register('escuela')}
                            data={escuelas?.map(e => ({ value: String(e.id), label: e.nombre })) || []}
                            searchable
                        />
                    </SimpleGrid>

                    <Group justify="center">
                        <ColorPicker 
                            label="Color del Evento" 
                            {...register('color')}
                            format="hex"
                        />
                    </Group>

                    <Group justify="flex-end" mt="xl">
                        <Button variant="subtle" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" color="blue" radius="md">
                            {initialData ? 'Actualizar' : 'Crear Tarea'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

// Helper to avoid import errors since SimpleGrid was used but not imported
import { SimpleGrid, Divider } from '@mantine/core';

export default TaskModal;
