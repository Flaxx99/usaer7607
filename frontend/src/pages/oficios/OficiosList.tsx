import React, { useState } from 'react';
import { 
    Container, Stack, Paper, Title, Text, Button, Table, 
    Group, ActionIcon, Tooltip, Modal, TextInput, 
    FileInput, Pagination, Loader, Center, ThemeIcon
} from '@mantine/core';
import { 
    Plus, Search, Trash2, FileText, Download, UploadCloud 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';
import { getOficios, uploadOficio, deleteOficio, Oficio } from '../../api/oficios';

const OficiosList = () => {
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const queryClient = useQueryClient();

    const { data: paginatedOficios, isLoading } = useQuery({
        queryKey: ['oficios', page, busquedaDebounced],
        queryFn: () => getOficios(page, busquedaDebounced),
    });

    const oficios = paginatedOficios?.results || [];
    const totalCount = paginatedOficios?.count || 0;

    const uploadMutation = useMutation({
        mutationFn: uploadOficio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oficios'] });
            setIsModalOpen(false);
            notifications.show({ title: 'Éxito', message: 'Oficio subido correctamente.', color: 'green' });
        },
        onError: () => notifications.show({ title: 'Error', message: 'No se pudo subir el archivo.', color: 'red' }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOficio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oficios'] });
            notifications.show({ title: 'Eliminado', message: 'El oficio ha sido borrado.', color: 'blue' });
        },
    });

    const handleFileUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        
        uploadMutation.mutate(formData);
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: '¿Eliminar oficio?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
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
                <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                                <FileText size={30} />
                            </ThemeIcon>
                            <div>
                                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                    Gestión de Oficios
                                </Title>
                                <Text size="sm" c="dimmed" fw={500}>
                                    Archivo digital de documentos oficiales enviados y recibidos por la USAER 7607.
                                </Text>
                            </div>
                        </Group>
                        
                        <Button 
                            size="lg" 
                            radius="md" 
                            leftSection={<Plus size={22} />} 
                            onClick={() => setIsModalOpen(true)}
                            color="blue"
                            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                        >
                            Subir Nuevo Oficio
                        </Button>
                    </Group>
                </Paper>

                <Paper p="md" radius="lg" withBorder shadow="xs">
                    <TextInput 
                        size="md"
                        label="Buscar Oficio"
                        placeholder="Escribe el título o descripción del documento..." 
                        leftSection={<Search size={18} />}
                        value={busqueda} 
                        onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                    />
                </Paper>

                <Paper radius="lg" withBorder shadow="xs" overflow="hidden">
                    <Table striped highlightOnHover verticalSpacing="md">
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th>Título del Documento</Table.Th>
                                <Table.Th>Descripción</Table.Th>
                                <Table.Th>Fecha de Subida</Table.Th>
                                <Table.Th ta="center">Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {oficios.map((oficio) => (
                                <Table.Tr key={oficio.id}>
                                    <Table.Td fw={700}>{oficio.titulo}</Table.Td>
                                    <Table.Td>{oficio.descripcion || 'Sin descripción'}</Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{new Date(oficio.fecha_subida).toLocaleDateString()}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="center" gap="xs">
                                            <Tooltip label="Ver / Descargar">
                                                <ActionIcon 
                                                    variant="light" 
                                                    color="blue" 
                                                    size="lg" 
                                                    radius="md"
                                                    component="a" 
                                                    href={oficio.archivo} 
                                                    target="_blank"
                                                >
                                                    <Download size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Eliminar">
                                                <ActionIcon 
                                                    variant="light" 
                                                    color="red" 
                                                    size="lg" 
                                                    radius="md"
                                                    onClick={() => handleDelete(oficio.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                    
                    {oficios.length === 0 && (
                        <Center py="xl">
                            <Stack align="center">
                                <UploadCloud size={48} color="var(--mantine-color-gray-4)" />
                                <Text fw={600} c="dimmed">No hay oficios registrados en el archivo.</Text>
                            </Stack>
                        </Center>
                    )}
                </Paper>

                <Group justify="center" py="md">
                    <Pagination 
                        total={Math.ceil(totalCount / 10)} 
                        value={page} 
                        onChange={setPage} 
                        color="blue" 
                        radius="md" 
                        size="md" 
                    />
                </Group>
            </Stack>

            <Modal 
                opened={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={<Title order={3} fw={800}>📤 Subir Documento Oficial</Title>}
                size="md"
                radius="lg"
                centered
            >
                <form onSubmit={handleFileUpload}>
                    <Stack gap="md">
                        <TextInput 
                            name="titulo"
                            label="Título del Oficio" 
                            placeholder="Ej. Reporte Trimestral de Alumnos" 
                            required
                            size="md"
                        />
                        <TextInput 
                            name="descripcion"
                            label="Descripción / Notas" 
                            placeholder="Ej. Enviado a la supervisión escolar zona 01" 
                            size="md"
                        />
                        <FileInput 
                            name="archivo"
                            label="Archivo (PDF, Imagen)" 
                            placeholder="Selecciona el documento" 
                            required
                            size="md"
                            accept="application/pdf,image/*"
                        />
                        <Group justify="flex-end" pt="md">
                            <Button variant="subtle" color="gray" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                color="blue" 
                                loading={uploadMutation.isPending}
                                leftSection={<UploadCloud size={18} />}
                            >
                                Subir Archivo
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
};

export default OficiosList;
