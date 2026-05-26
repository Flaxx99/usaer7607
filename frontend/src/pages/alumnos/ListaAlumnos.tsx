import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
  Plus, Search, Users, Edit2, Trash2, GraduationCap, 
  Save, School as SchoolIcon, Activity, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Container, 
  Grid, 
  Paper, 
   Title, 
   Text, 
   TextInput, 
   Select, 
   Button, 
   Table, 
   Badge, 
   Group, 
   Avatar, 
   ActionIcon, 
   Modal, 
   Checkbox, 
   Stack, 
   Loader, 
   Center,
   SimpleGrid,
   SegmentedControl,
   Box,
   Tooltip,
   ThemeIcon,
   Pagination
 } from '@mantine/core';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton } from '../../components/Skeletons';

// API
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../../api/alumnos';
import { getEscuelas } from '../../api/escuelas'; 
import { getMaestros } from '../../api/usuarios';

// INTERFACES
import type { Alumno } from '../../interfaces/alumno';

const CLASIFICACIONES_OPCIONES = [
  { value: 'NINGUNO', label: 'NINGUNO (En evaluación)' },
  { value: 'DISCAPACIDAD', label: 'DISCAPACIDAD' },
  { value: 'DIFICULTADES_SEVERAS', label: 'DIFICULTADES SEVERAS' },
  { value: 'TRASTORNOS', label: 'TRASTORNOS (TDAH, TEA...)' },
  { value: 'APTITUDES_SOBRESALIENTES', label: 'APTITUDES SOBRESALIENTES' },
  { value: 'OTRO', label: 'OTRO (Especifique)' }
];

const ListaAlumnos = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [filtroEscuela, setFiltroEscuela] = useState<string | null>('TODAS');
  const [filtroCondicion, setFiltroCondicion] = useState<string | null>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('ACTIVOS');
  const [page, setPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<Alumno>();

  // Resetear a página 1 cuando cambia la búsqueda debounced
  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced]);

  // 1. CARGA DE DATOS (TanStack Query)
  const { data: paginatedAlumnos, isLoading: loadingAlumnos } = useQuery({
    queryKey: ['alumnos', page, busquedaDebounced, filtroEscuela, filtroCondicion, filtroEstado],
    queryFn: () => getAlumnos(page, busquedaDebounced, filtroEscuela || '', filtroCondicion || '', filtroEstado),
  });

  const alumnos = paginatedAlumnos?.results || [];
  const totalCount = paginatedAlumnos?.count || 0;

  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: getEscuelas,
  });

  const { data: maestros } = useQuery({
    queryKey: ['maestros'],
    queryFn: getMaestros,
  });

  // Selectores para filtros en formato Mantine
  const escuelasOpciones = useMemo(() => {
    if (!escuelas) return [{ value: 'TODAS', label: '🏫 Todas las Escuelas' }];
    return [
      { value: 'TODAS', label: '🏫 Todas las Escuelas' },
      ...escuelas.map(e => ({ value: String(e.id), label: `${e.nombre} (${e.nivel})` }))
    ];
  }, [escuelas]);

  const condicionesOpciones = useMemo(() => {
    return [
      { value: 'TODAS', label: '🩺 Todas las Condiciones' },
      ...CLASIFICACIONES_OPCIONES
    ];
  }, []);

  // --- LÓGICA DINÁMICA DE GRADOS ---
  const escuelaIdSeleccionada = watch('escuela');

  const gradosDisponibles = useMemo(() => {
    if (!escuelas || !escuelaIdSeleccionada) return ['1', '2', '3', '4', '5', '6']; 
    const escuelaEncontrada = escuelas.find(e => e.id === Number(escuelaIdSeleccionada));
    if (!escuelaEncontrada) return ['1', '2', '3', '4', '5', '6'];

    const nivel = escuelaEncontrada.nivel.toUpperCase();
    if (nivel.includes('PREESCOLAR') || nivel.includes('KINDER') || nivel.includes('SECUNDARIA')) {
        return ['1', '2', '3'];
    } else {
        return ['1', '2', '3', '4', '5', '6'];
    }
  }, [escuelas, escuelaIdSeleccionada]);

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      Swal.fire('¡Registrado!', 'El alumno ha sido dado de alta exitosamente.', 'success');
    },
    onError: () => Swal.fire('Error', 'Revisa los datos (posible CURP ya registrada).', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: updateAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      cerrarModal();
      Swal.fire('¡Guardado!', 'Datos escolares actualizados.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo guardar la información.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlumno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      Swal.fire('Eliminado', 'El alumno ha sido dado de baja de la USAER.', 'success');
    },
    onError: () => Swal.fire('Error', 'No se puede eliminar (registros vinculados).', 'error')
  });

  // --- FUNCIONES ---
  const cerrarModal = () => {
    setIsModalOpen(false);
    setAlumnoEditar(null);
    reset();
  };

  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleOpenCreate = () => {
    setAlumnoEditar(null);
    reset({
        activo: true,
        sexo: 'H',
        grado: '1',
        clasificacion: 'NINGUNO',
        grupo: 'A',
        escuela: undefined,
        profesor: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (alumno: Alumno) => {
    setAlumnoEditar(alumno);
    reset(alumno); 
    setIsModalOpen(true);
  };

  const onSubmit = (data: Alumno) => {
    data.nombres = data.nombres.toUpperCase();
    data.apellido_paterno = data.apellido_paterno.toUpperCase();
    data.apellido_materno = data.apellido_materno ? data.apellido_materno.toUpperCase() : '';
    data.curp = data.curp.toUpperCase();
    data.grupo = data.grupo.toUpperCase();

    if (!data.profesor || String(data.profesor) === "") {
        data.profesor = null; 
    } else {
        data.profesor = Number(data.profesor);
    }

    if (alumnoEditar) {
        updateMutation.mutate({ ...data, id: alumnoEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Dar de baja alumno?', 
      text: "Se mantendrá el expediente histórico pero el alumno saldrá de atención activa.", 
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonColor: '#d33', 
      confirmButtonText: 'Sí, dar de baja'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  // --- FILTRADO AVANZADO (Para maestros) ---
  const clasificacionActual = watch('clasificacion');

  if (loadingAlumnos) {
    return (
      <Container size="xl" py="md">
        <TableSkeleton rows={10} />
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        
        {/* ========================================================================= */}
        {/* CABECERA CON ESTILO ESCOLAR Y BOTÓN DE ACCIÓN GIGANTE */}
        {/* ========================================================================= */}
        <Paper p="lg" radius="lg" withBorder shadow="sm" bg="blue.0" style={{ borderLeft: '8px solid var(--mantine-color-blue-6)' }}>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ThemeIcon size={52} radius="lg" color="blue" variant="filled">
                <Users size={30} />
              </ThemeIcon>
              <div>
                <Title order={1} fw={900} lts={-0.5} style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                  Control de Alumnos
                </Title>
                <Text size="sm" c="dimmed" fw={500}>
                  Lista oficial y expedientes de estudiantes atendidos por la USAER 7607
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
              Nuevo Ingreso Alumno
            </Button>
          </Group>
        </Paper>

        {/* ========================================================================= */}
        {/* PANEL DE BÚSQUEDA Y FILTRADO ULTRA-ACCESIBLE */}
        {/* ========================================================================= */}
        <Paper p="md" radius="lg" withBorder shadow="xs">
          <Stack gap="md">
            <Group gap="xs">
              <Filter size={16} className="text-blue-500" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>Filtros de Búsqueda Rápida</Text>
            </Group>
            
            <Grid align="flex-end">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput 
                  size="md"
                  label="Buscar Alumno"
                  placeholder="Escribe Apellido, Nombre o CURP..." 
                  leftSection={<Search size={18} />}
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </Grid.Col>
              
               <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                 <Select
                   size="md"
                   label="Filtrar por Escuela"
                   data={escuelasOpciones}
                   value={filtroEscuela}
                   onChange={(val) => handleFilterChange(setFiltroEscuela, val)}
                   searchable
                 />
               </Grid.Col>

               <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                 <Select
                   size="md"
                   label="Filtrar por Diagnóstico"
                   data={condicionesOpciones}
                   value={filtroCondicion}
                   onChange={(val) => handleFilterChange(setFiltroCondicion, val)}
                   searchable
                 />
               </Grid.Col>

               <Grid.Col span={{ base: 12, md: 2 }}>
                 <Stack gap={2}>
                   <Text size="xs" fw={600} style={{ marginBottom: '3px' }}>Estado</Text>
                   <SegmentedControl
                     size="sm"
                     value={filtroEstado}
                     onChange={(val) => handleFilterChange(setFiltroEstado, val)}
                     data={[
                       { label: 'Activos', value: 'ACTIVOS' },
                       { label: 'Bajas', value: 'BAJAS' },
                       { label: 'Todos', value: 'TODOS' }
                     ]}
                     color="blue"
                     radius="md"
                   />
                 </Stack>
               </Grid.Col>

            </Grid>
          </Stack>
        </Paper>

        {/* ========================================================================= */}
        {/* TABLA DE ALUMNOS CON BOTONES GRANDES Y VISIBLES (UX ACCESIBLE) */}
        {/* ========================================================================= */}
        <Paper radius="lg" withBorder shadow="xs" style={{ overflow: 'hidden' }}>
          <Table.ScrollContainer minWidth={800}>
            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th fw={800} style={{ fontSize: '0.85rem' }}>Estudiante / CURP</Table.Th>
                  <Table.Th fw={800} style={{ fontSize: '0.85rem' }}>Escuela de Procedencia</Table.Th>
                  <Table.Th fw={800} style={{ fontSize: '0.85rem' }}>Diagnóstico / Condición</Table.Th>
                  <Table.Th fw={800} style={{ fontSize: '0.85rem' }} ta="center">Estatus</Table.Th>
                  <Table.Th fw={800} style={{ fontSize: '0.85rem' }} ta="center">Acciones del Maestro</Table.Th>
                </Table.Tr>
              </Table.Thead>
               <Table.Tbody>
                 {alumnos.map((item) => (
                   <Table.Tr key={item.id}>

                    
                    {/* COLUMNA 1: ALUMNO */}
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color={item.sexo === 'H' ? 'blue' : 'grape'} radius="xl" size="md">
                          {item.nombres.charAt(0)}
                        </Avatar>
                        <div>
                          <Text fw={800} size="md" c="gray.8">
                            {item.nombres} {item.apellido_paterno} {item.apellido_materno}
                          </Text>
                          <Group gap={6} mt={2}>
                            <Badge size="xs" variant="light" color="gray" fontStyle="mono">{item.curp}</Badge>
                            <Badge size="xs" variant="light" color={item.sexo === 'H' ? 'blue' : 'grape'}>
                              {item.sexo === 'H' ? 'Niño' : 'Niña'}
                            </Badge>
                          </Group>
                        </div>
                      </Group>
                    </Table.Td>

                    {/* COLUMNA 2: ESCUELA */}
                    <Table.Td>
                      <Group gap="xs">
                        <SchoolIcon size={16} className="text-blue-500" />
                        <div>
                          <Text fw={700} size="sm" c="gray.8">
                            {item.escuela_detalle?.nombre || `Escuela #${item.escuela}`}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {item.grado}° Grado • Grupo "{item.grupo}"
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>

                    {/* COLUMNA 3: DIAGNÓSTICO */}
                    <Table.Td>
                      <Stack gap={4}>
                        <Badge 
                          size="md" 
                          variant="light" 
                          color={
                            item.clasificacion === 'NINGUNO' ? 'gray' :
                            item.clasificacion === 'DISCAPACIDAD' ? 'violet' :
                            item.clasificacion === 'DIFICULTADES_SEVERAS' ? 'orange' :
                            item.clasificacion === 'TRASTORNOS' ? 'red' : 'teal'
                          }
                          radius="sm"
                        >
                          {item.clasificacion.replace('_', ' ')}
                        </Badge>
                        {item.clasificacion_otro && (
                          <Text size="xs" c="dimmed" fs="italic" pl={4}>
                            "{item.clasificacion_otro}"
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>

                    {/* COLUMNA 4: ESTATUS */}
                    <Table.Td ta="center">
                      <Badge size="md" variant="filled" color={item.activo ? 'green' : 'red'}>
                        {item.activo ? 'Activo' : 'Baja'}
                      </Badge>
                    </Table.Td>

                    {/* COLUMNA 5: ACCIONES (GRANDES, VISIBLES, TÁCTILES) */}
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        <Tooltip label="Editar datos del alumno" position="top">
                          <Button 
                            size="xs" 
                            variant="light" 
                            color="blue" 
                            leftSection={<Edit2 size={14} />}
                            onClick={() => handleOpenEdit(item)}
                            radius="md"
                          >
                            Editar
                          </Button>
                        </Tooltip>
                        
                        <Tooltip label="Dar de baja de USAER" position="top">
                          <Button 
                            size="xs" 
                            variant="light" 
                            color="red" 
                            leftSection={<Trash2 size={14} />}
                            onClick={() => handleDelete(item.id)}
                            radius="md"
                          >
                            Baja
                          </Button>
                        </Tooltip>
                      </Group>
                    </Table.Td>

                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
           </Table.ScrollContainer>
           
           {alumnos.length === 0 && (
             <Box p="xl" style={{ textAlign: 'center' }}>
               <Text size="md" c="dimmed" fw={500}>
                 🔍 No encontramos alumnos que coincidan con los filtros aplicados.
               </Text>
             </Box>
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
             siblings={2} 
             boundaries={1} 
           />
         </Group>

         {/* ========================================================================= */}

        {/* MODAL FORMULARIO DE ALUMNOS (DISEÑO ESCOLAR, AMPLIO Y CLARO) */}
        {/* ========================================================================= */}
        <Modal 
          opened={isModalOpen} 
          onClose={cerrarModal} 
          title={
            <Group gap="xs">
              <Sparkles size={20} className="text-yellow-500" />
              <Title order={3} fw={800}>
                {alumnoEditar ? "Modificar Ficha de Alumno" : "Inscripción de Nuevo Alumno"}
              </Title>
            </Group>
          }
          size="lg"
          radius="lg"
          centered
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="lg">
              
              {/* SECCIÓN 1: DATOS PERSONALES */}
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={800} c="blue" mb="md" style={{ borderBottom: '2px solid var(--mantine-color-blue-1)', pb: '4px' }}>
                  🍎 1. Datos Personales del Niño/a
                </Text>
                
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                    <TextInput 
                      label="Nombre(s)" 
                      placeholder="Ej. LUIS ANGEL" 
                      required
                      {...register('nombres', { required: "El nombre es obligatorio" })}
                      error={errors.nombres?.message}
                    />
                    <TextInput 
                      label="Apellido Paterno" 
                      placeholder="Ej. VIDAL" 
                      required
                      {...register('apellido_paterno', { required: "El apellido es obligatorio" })}
                      error={errors.apellido_paterno?.message}
                    />
                    <TextInput 
                      label="Apellido Materno" 
                      placeholder="Ej. BUSTAMANTE" 
                      {...register('apellido_materno')}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                    <TextInput 
                      label="CURP" 
                      placeholder="18 CARACTERES" 
                      required
                      {...register('curp', { 
                        required: "La CURP es obligatoria", 
                        minLength: { value: 18, message: "Debe tener 18 caracteres" },
                        maxLength: { value: 18, message: "Debe tener 18 caracteres" }
                      })}
                      error={errors.curp?.message}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    />
                    
                    <TextInput 
                      type="date"
                      label="Fecha de Nacimiento" 
                      {...register('fecha_nacimiento')}
                    />

                    <Controller
                      name="sexo"
                      control={control}
                      defaultValue="H"
                      render={({ field }) => (
                        <Select
                          label="Sexo"
                          data={[
                            { value: 'H', label: 'Niño (Hombre)' },
                            { value: 'M', label: 'Niña (Mujer)' }
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </SimpleGrid>
                </Stack>
              </Paper>

              {/* SECCIÓN 2: ASIGNACIÓN DE DOCENTE */}
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={800} c="blue" mb="md" style={{ borderBottom: '2px solid var(--mantine-color-blue-1)', pb: '4px' }}>
                  🧑‍🏫 2. Maestro/a de Apoyo USAER
                </Text>
                
                <Controller
                  name="profesor"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Maestro Responsable"
                      placeholder="Seleccione el maestro de apoyo"
                      data={maestros?.map(m => ({ value: String(m.id), label: `${m.nombre} ${m.apellido_paterno} (${m.email})` })) || []}
                      value={field.value ? String(field.value) : ''}
                      onChange={(val) => field.onChange(val ? Number(val) : null)}
                      searchable
                      clearable
                    />
                  )}
                />
                <Text size="10px" c="dimmed" mt={4}>
                  * Deja vacío para asignación automática al docente que está realizando la captura actual.
                </Text>
              </Paper>

              {/* SECCIÓN 3: DATOS ESCOLARES */}
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={800} c="blue" mb="md" style={{ borderBottom: '2px solid var(--mantine-color-blue-1)', pb: '4px' }}>
                  🏫 3. Escuela Regular y Ubicación Grado/Grupo
                </Text>
                
                <Stack gap="sm">
                  <Controller
                    name="escuela"
                    control={control}
                    rules={{ required: "La escuela es obligatoria" }}
                    render={({ field }) => (
                      <Select
                        label="Escuela Regular de Procedencia"
                        placeholder="Busca la escuela..."
                        data={escuelas?.map(e => ({ value: String(e.id), label: `${e.nombre} (${e.nivel})` })) || []}
                        value={field.value ? String(field.value) : ''}
                        onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                        searchable
                        required
                        error={errors.escuela?.message}
                      />
                    )}
                  />

                  <SimpleGrid cols={2} spacing="xs">
                    <Controller
                      name="grado"
                      control={control}
                      defaultValue="1"
                      render={({ field }) => (
                        <Select
                          label="Grado Escolar"
                          data={gradosDisponibles.map(g => ({ value: g, label: `${g}° Grado` }))}
                          value={String(field.value)}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <TextInput 
                      label="Grupo" 
                      placeholder="Ej. A" 
                      required
                      {...register('grupo', { required: "El grupo es obligatorio" })}
                      error={errors.grupo?.message}
                      style={{ textTransform: 'uppercase', textAlign: 'center' }}
                    />
                  </SimpleGrid>
                </Stack>
              </Paper>

              {/* SECCIÓN 4: CLASIFICACIÓN USAER */}
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={800} c="blue" mb="md" style={{ borderBottom: '2px solid var(--mantine-color-blue-1)', pb: '4px' }}>
                  🩺 4. Clasificación y Diagnóstico Especializado
                </Text>
                
                <Stack gap="sm">
                  <Controller
                    name="clasificacion"
                    control={control}
                    defaultValue="NINGUNO"
                    render={({ field }) => (
                      <Select
                        label="Condición / Diagnóstico Principal"
                        data={CLASIFICACIONES_OPCIONES}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  {clasificacionActual === 'OTRO' && (
                    <TextInput 
                      label="Especifique condición:" 
                      placeholder="Ej. Trastorno motor fino..."
                      required
                      {...register('clasificacion_otro', { required: "Debe especificar la condición si selecciona OTRO" })}
                      error={errors.clasificacion_otro?.message}
                    />
                  )}

                  <Box p="sm" style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)' }}>
                    <Controller
                      name="activo"
                      control={control}
                      defaultValue={true}
                      render={({ field }) => (
                        <Checkbox
                          size="md"
                          label="Atención Activa (El alumno está recibiendo apoyo actualmente)"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.currentTarget.checked)}
                        />
                      )}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* BOTONES DE ACCIÓN */}
              <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Button variant="subtle" color="gray" onClick={cerrarModal} size="md">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  loading={createMutation.isPending || updateMutation.isPending} 
                  color="blue"
                  size="md"
                  leftSection={<Save size={18} />}
                >
                  Guardar Ficha Escolar
                </Button>
              </Group>

            </Stack>
          </form>
        </Modal>

      </Stack>
    </Container>
  );
};

export default ListaAlumnos;