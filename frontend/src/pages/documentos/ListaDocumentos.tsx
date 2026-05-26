import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Search, FolderOpen, Edit2, Trash2, 
    FileText, Save, Paperclip, X, UploadCloud, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
    Container, 
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
    Select, 
    ThemeIcon, 
    Center, 
    Loader, 
    Box, 
    Divider,
    Grid,
    ActionIcon,
    Tooltip,
    Textarea,
    FileInput,
    List,
    rem
} from '@mantine/core';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CardGridSkeleton } from '../../components/Skeletons';

import { 
    getDocumentos, createDocumento, updateDocumento, 
    deleteDocumento, deleteArchivoExtra 
} from '../../api/documentos';
import { getAlumnos } from '../../api/alumnos';
import type { Expediente } from '../../interfaces/documentos';

const ListaDocumentos = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docEditar, setDocEditar] = useState<Expediente | null>(null);
  
  const [extrasTemp, setExtrasTemp] = useState<{file: File, descripcion: string}[]>([]);
  const [tempDesc, setTempDesc] = useState('');

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Expediente>();

  const { data: documentos, isLoading: loadingDocs } = useQuery({
    queryKey: ['documentos'],
    queryFn: getDocumentos,
  });

  const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
    queryKey: ['alumnos'],
    queryFn: getAlumnos,
  });

  const createMutation = useMutation({
    mutationFn: createDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      Swal.fire('¡Guardado! 📂', 'Expediente creado correctamente', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se pudo crear el expediente', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      Swal.fire('¡Actualizado! ✏️', 'Expediente actualizado', 'success');
    },
    onError: () => Swal.fire('Error ❌', 'No se pudo actualizar', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      Swal.fire('¡Eliminado! 🗑️', 'Expediente borrado', 'success');
    }
  });

  const deleteExtraMutation = useMutation({
    mutationFn: ({ expId, archId }: { expId: number, archId: number }) => deleteArchivoExtra(expId, archId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (docEditar) {
         Swal.fire('Archivo eliminado', '', 'success');
         cerrarModal();
      }
    }
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setDocEditar(null);
    setExtrasTemp([]);
    setTempDesc('');
    reset();
  };

  const handleOpenCreate = () => {
    setDocEditar(null);
    setExtrasTemp([]);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Expediente) => {
    setDocEditar(doc);
    setExtrasTemp([]);
    reset(doc);
    setIsModalOpen(true);
  };

  const onAddExtraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setExtrasTemp([...extrasTemp, { file, descripcion: tempDesc || file.name }]);
        setTempDesc('');
        e.target.value = '';
    }
  };

  const onRemoveExtraTemp = (index: number) => {
    const nuevos = [...extrasTemp];
    nuevos.splice(index, 1);
    setExtrasTemp(nuevos);
  };

  const onSubmit = (data: Expediente) => {
    data.nuevos_archivos_temp = extrasTemp;
    if (docEditar) {
        updateMutation.mutate({ ...data, id: docEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar Expediente?', text: "Se borrarán todos los archivos asociados.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const handleDeleteExtraReal = (archivoId: number) => {
     if(!docEditar) return;
     Swal.fire({
        title: '¿Borrar anexo?', text: "Se eliminará permanentemente.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Borrar'
     }).then((r) => { 
         if (r.isConfirmed) {
             deleteExtraMutation.mutate({ expId: docEditar.id, archId: archivoId });
         }
     });
  };

  const documentosFiltrados = documentos?.filter(e => 
    e.alumno_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) || 
    e.profesor_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const isLoading = loadingDocs || loadingAlumnos;

  if (isLoading) {
      return (
        <Container size="xl" py="md">
          <CardGridSkeleton cols={9} />
        </Container>
      );
  }

  return (
    <Container size="xl" py="md">
        <Stack gap="xl">
            
            {/* ========================================================================= */}
            {/* CABECERA */}
            {/* ========================================================================= */}
            <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                            <FolderOpen size={30} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                                Documentos y Expedientes
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Gestión de archivos psicopedagógicos y planes de intervención por alumno.
                            </Text>
                        </div>
                    </Group>
                    
                    <Button 
                        size="lg" 
                        radius="md" 
                        leftSection={<Plus size={22} />} 
                        onClick={handleOpenCreate}
                        color="blue"
                        style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                    >
                        Nuevo Expediente
                    </Button>
                </Group>
            </Paper>

            {/* ========================================================================= */}
            {/* BUSCADOR */}
            {/* ========================================================================= */}
            <Paper p="md" radius="lg" withBorder shadow="xs">
                <TextInput 
                    size="md"
                    label="Buscar Expediente"
                    placeholder="Escribe el nombre del alumno o profesor..." 
                    leftSection={<Search size={18} />}
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </Paper>

            {/* ========================================================================= */}
            {/* GRID DE EXPEDIENTES */}
            {/* ========================================================================= */}
            <Grid gutter="lg">
                {documentosFiltrados?.map((doc) => {
                    const docsCount = [doc.informe_deteccion, doc.informe_psicopedagogico, doc.plan_intervencion].filter(Boolean).length;
                    const totalDocs = 3;
                    const progressColor = docsCount === totalDocs ? 'green' : docsCount > 0 ? 'orange' : 'gray';

                    return (
                    <Grid.Col key={doc.id} span={{ base: 12, md: 6, lg: 4 }}>
                        <Paper 
                            p="lg" 
                            radius="lg" 
                            withBorder 
                            shadow="xs"
                            style={{ 
                                borderLeft: `6px solid var(--mantine-color-${progressColor}-6)`,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Stack gap="xs">
                                {/* Alumno y Profesor */}
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Title order={3} fw={800} c="gray.8" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                                            {doc.alumno_nombre}
                                        </Title>
                                        <Text size="sm" c="dimmed" fw={500}>
                                            Prof. {doc.profesor_nombre}
                                        </Text>
                                    </div>
                                    <Badge color={progressColor} variant="light" size="lg" fw={700}>
                                        {docsCount}/{totalDocs} Docs
                                    </Badge>
                                </Group>

                                <Divider my="xs" />

                                {/* Estado de Documentos Base */}
                                <Stack gap="xs">
                                    <DocStatus 
                                        label="Informe de Detección" 
                                        hasFile={!!doc.informe_deteccion} 
                                        url={doc.informe_deteccion as string} 
                                    />
                                    <DocStatus 
                                        label="Informe Psicopedagógico" 
                                        hasFile={!!doc.informe_psicopedagogico} 
                                        url={doc.informe_psicopedagogico as string} 
                                    />
                                    <DocStatus 
                                        label="Plan de Intervención" 
                                        hasFile={!!doc.plan_intervencion} 
                                        url={doc.plan_intervencion as string} 
                                    />
                                </Stack>

                                {/* Anexos y Fecha */}
                                <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}>
                                    <Group gap="xs">
                                        <Paperclip size={16} className="text-gray-500" />
                                        <Text size="sm" c="dimmed" fw={600}>
                                            {doc.otros_archivos?.length || 0} Anexos
                                        </Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Tooltip label="Editar expediente">
                                            <ActionIcon 
                                                variant="light" 
                                                color="blue" 
                                                size="lg" 
                                                radius="md"
                                                onClick={() => handleOpenEdit(doc)}
                                            >
                                                <Edit2 size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Eliminar expediente">
                                            <ActionIcon 
                                                variant="light" 
                                                color="red" 
                                                size="lg" 
                                                radius="md"
                                                onClick={() => handleDelete(doc.id)}
                                            >
                                                <Trash2 size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                )})}

                {documentosFiltrados?.length === 0 && (
                    <Grid.Col span={12}>
                        <Paper p="xl" withBorder radius="lg" bg="gray.0" ta="center">
                          <FolderOpen size={48} className="text-gray-400 mx-auto" style={{ marginBottom: '12px' }} />
                          <Text fw={600} c="dimmed">No se encontraron expedientes con ese criterio de búsqueda.</Text>
                        </Paper>
                    </Grid.Col>
                )}
            </Grid>

            {/* ========================================================================= */}
            {/* --- MODAL CREAR/EDITAR EXPEDIENTE --- */}
            {/* ========================================================================= */}
            <Modal 
              opened={isModalOpen} 
              onClose={cerrarModal} 
              title={<Title order={3} fw={800}>📂 {docEditar ? "Editar Expediente" : "Nuevo Expediente"}</Title>}
              size="lg"
              radius="lg"
              centered
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    {/* 1. SELECCIÓN DE ALUMNO */}
                    <Paper p="sm" bg="blue.0" withBorder radius="md">
                        <Select
                            label="Alumno"
                            placeholder="Selecciona un alumno"
                            data={alumnos?.map(a => ({ 
                                value: String(a.id), 
                                label: `${a.nombres} ${a.apellido_paterno} ${a.apellido_materno}` 
                            })) || []}
                            disabled={!!docEditar}
                            required
                            {...register('alumno', { required: "Selecciona un alumno" })}
                            error={errors.alumno?.message}
                            size="md"
                        />
                    </Paper>

                    <Divider label="Documentos Base" labelPosition="center" />

                    {/* 2. ARCHIVOS PRINCIPALES */}
                    <Grid gutter="md">
                        <Grid.Col span={6}>
                            <FileInput 
                                label="Informe de Detección"
                                placeholder="Seleccionar archivo..."
                                leftSection={<FileText size={16} />}
                                accept=".pdf,.doc,.docx"
                                {...register('informe_deteccion')}
                                size="md"
                            />
                            {docEditar?.informe_deteccion && (
                                <Text size="xs" c="green.6" fw={600} mt={4}>✓ Archivo cargado previamente</Text>
                            )}
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <FileInput 
                                label="Informe Psicopedagógico"
                                placeholder="Seleccionar archivo..."
                                leftSection={<FileText size={16} />}
                                accept=".pdf,.doc,.docx"
                                {...register('informe_psicopedagogico')}
                                size="md"
                            />
                            {docEditar?.informe_psicopedagogico && (
                                <Text size="xs" c="green.6" fw={600} mt={4}>✓ Archivo cargado previamente</Text>
                            )}
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <FileInput 
                                label="Plan de Intervención"
                                placeholder="Seleccionar archivo..."
                                leftSection={<FileText size={16} />}
                                accept=".pdf,.doc,.docx"
                                {...register('plan_intervencion')}
                                size="md"
                            />
                            {docEditar?.plan_intervencion && (
                                <Text size="xs" c="green.6" fw={600} mt={4}>✓ Archivo cargado previamente</Text>
                            )}
                        </Grid.Col>
                    </Grid>

                    {/* 3. OBSERVACIONES */}
                    <Textarea 
                        label="Observaciones"
                        placeholder="Notas adicionales sobre el expediente..."
                        {...register('observaciones')}
                        size="md"
                        minRows={2}
                    />

                    <Divider label="Archivos Anexos" labelPosition="center" />

                    {/* 4. ANEXOS / EXTRAS */}
                    <Paper p="sm" bg="gray.0" withBorder radius="md">
                        <Stack gap="sm">
                            {/* Lista Existentes */}
                            {docEditar && docEditar.otros_archivos && docEditar.otros_archivos.length > 0 && (
                                <Box>
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Archivos Guardados:</Text>
                                    <List spacing="xs" size="sm" center>
                                        {docEditar.otros_archivos.map(archivo => (
                                            <List.Item 
                                                key={archivo.id}
                                                icon={<FileText size={16} color="var(--mantine-color-blue-6)" />}
                                                style={{ 
                                                    background: 'white', 
                                                    padding: '8px', 
                                                    borderRadius: 'var(--mantine-radius-sm)',
                                                    border: '1px solid var(--mantine-color-gray-2)'
                                                }}
                                            >
                                                <Group justify="space-between" w="100%">
                                                    <a href={archivo.url_archivo || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                                        {archivo.nombre_archivo}
                                                    </a>
                                                    <Group gap="xs">
                                                        <Text size="xs" c="dimmed">{archivo.descripcion || 'Sin descripción'}</Text>
                                                        <ActionIcon 
                                                            variant="subtle" 
                                                            color="red" 
                                                            size="sm"
                                                            onClick={() => handleDeleteExtraReal(archivo.id)}
                                                        >
                                                            <X size={14} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>
                                            </List.Item>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Subir Nuevos */}
                            <Box>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Agregar Nuevo Anexo:</Text>
                                <Group gap="xs" align="flex-end">
                                    <TextInput 
                                        placeholder="Descripción (ej. Entrevista padres)"
                                        value={tempDesc}
                                        onChange={(e) => setTempDesc(e.target.value)}
                                        style={{ flex: 1 }}
                                        size="md"
                                    />
                                    <input 
                                        type="file" 
                                        id="file-extra" 
                                        className="hidden" 
                                        onChange={onAddExtraFile} 
                                    />
                                    <label htmlFor="file-extra" className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm flex items-center gap-1 font-medium transition-colors" style={{ height: '36px' }}>
                                        <UploadCloud size={16} /> Seleccionar
                                    </label>
                                </Group>

                                {extrasTemp.length > 0 && (
                                    <Stack gap="xs" mt="sm">
                                        {extrasTemp.map((item, idx) => (
                                            <Group key={idx} justify="space-between" p="xs" bg="blue.0" radius="md">
                                                <Text size="sm" fw={600} c="blue.7">
                                                    {item.file.name} <Text component="span" size="xs" c="blue.6">({item.descripcion})</Text>
                                                </Text>
                                                <ActionIcon 
                                                    variant="subtle" 
                                                    color="red" 
                                                    size="sm"
                                                    onClick={() => onRemoveExtraTemp(idx)}
                                                >
                                                    <X size={16} />
                                                </ActionIcon>
                                            </Group>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Paper>

                    {/* BOTONES */}
                    <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Button variant="subtle" color="gray" onClick={cerrarModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="blue" leftSection={<Save size={18} />}>
                        {docEditar ? 'Guardar Cambios' : 'Registrar Expediente'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
            </Modal>

        </Stack>
    </Container>
  );
};

export default ListaDocumentos;