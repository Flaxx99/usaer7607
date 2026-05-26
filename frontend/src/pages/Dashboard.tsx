import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, School, ClipboardCheck, AlertCircle, Loader2, 
  Calendar, UserCheck, FileText, ArrowUpRight
} from 'lucide-react';
import { 
  Container, 
  SimpleGrid, 
  Text, 
  Title, 
  Group, 
  Badge, 
  Stack, 
  Box, 
  ThemeIcon,
  Paper,
  ScrollArea,
  Center,
  Avatar,
  Progress,
  Divider
} from '@mantine/core';
import { getDashboardData } from '../api/dashboard';

const ROLES_MAP: Record<string, string> = {
    'DIRECTOR': 'Director(a) de Escuela',
    'MAESTRO_APOYO': 'Maestro(a) de Apoyo',
    'TRAB_SOCIAL': 'Trabajador(a) Social',
    'PSICOLOGO': 'Psicólogo(a)',
    'PSICOMOTRICIDAD': 'Maestro(a) de Psicomotricidad',
    'COMUNICACION': 'Maestro(a) de Comunicación',
    'TRAB_MANUAL': 'Trabajador(a) Manual',
    'SECRETARIO': 'Secretario(a)',
    'ADMIN': 'Administrador del Sistema'
};

const Dashboard = () => {
  const [userData, setUserData] = useState({
    nombre: 'Usuario',
    rol: 'Cargando...',
    email: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        let nombreFinal = user.email ? user.email.split('@')[0] : 'Usuario';
        if (user.nombre_completo) {
            nombreFinal = user.nombre_completo;
        } else if ((user.nombre || user.first_name) && (user.apellido_paterno || user.last_name)) {
            const n = user.nombre || user.first_name || '';
            const a = user.apellido_paterno || user.last_name || '';
            nombreFinal = `${n} ${a}`.trim();
        } else if (user.username) {
            nombreFinal = user.username;
        }
        const rolCodigo = user.role; 
        const rolMostrar = ROLES_MAP[rolCodigo] || 'Personal USAER';

        setUserData({
          nombre: nombreFinal,
          rol: rolMostrar,
          email: user.email || ''
        });
      } catch (e) {
        console.error("Error leyendo usuario", e);
      }
    }
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Center h="70vh">
        <Stack align="center" gap="md">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <Text fw={600} size="lg" c="blue.6" className="animate-pulse">
            Sincronizando con el servidor...
          </Text>
          <Text size="xs" c="dimmed">Cargando indicadores de gestión escolar</Text>
        </Stack>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="70vh">
        <Paper p="xl" withBorder radius="lg" shadow="md" bg="red.0" style={{ textAlign: 'center', maxWidth: '450px' }}>
          <ThemeIcon color="red" size="xl" radius="xl" variant="light" mb="md">
            <AlertCircle size={32} />
          </ThemeIcon>
          <Title order={3} c="red.8" mb="xs">Error de Conexión</Title>
          <Text size="sm" c="red.7" mb="lg">
            No pudimos contactar al backend. Verifica que el servidor de Django esté activo.
          </Text>
          <Text size="xs" c="dimmed">Detalle: {error?.message || 'Error desconocido'}</Text>
        </Paper>
      </Center>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        
        {/* ========================================================================= */}
        {/* HEADER HERO (DISEÑO PREMIUM CON DEGRADADO) */}
        {/* ========================================================================= */}
        <Paper 
          radius="lg" 
          shadow="md" 
          p="xl" 
          style={{ 
            background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-indigo-8) 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Círculo decorativo de fondo */}
          <div style={{
            position: 'absolute',
            right: '-50px',
            top: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none'
          }} />

          <Group justify="space-between" align="center" wrap="nowrap" style={{ zIndex: 1, position: 'relative' }}>
            <Group gap="lg">
              <Avatar 
                size="xl" 
                radius="xl" 
                color="white" 
                style={{ 
                  border: '3px solid rgba(255,255,255,0.4)',
                  boxShadow: 'var(--mantine-shadow-md)',
                  background: 'rgba(255,255,255,0.1)'
                }}
              >
                {userData.nombre.charAt(0).toUpperCase()}
              </Avatar>
              <Stack gap={2}>
                <Title order={1} fw={800} style={{ letterSpacing: '-0.5px' }}>
                  ¡Hola, {userData.nombre}!
                </Title>
                <Group gap="xs">
                  <Text fw={500} opacity={0.9}>
                    {userData.rol}
                  </Text>
                  <Badge variant="white" color="blue" size="sm" radius="sm">
                     {data?.ciclo_actual || 'Ciclo Escolar'}
                  </Badge>
                </Group>
              </Stack>
            </Group>
            
            <Box ta="right" className="hidden sm:block" style={{ opacity: 0.9 }}>
              <Text size="xs" fw={700} tt="uppercase" lts={1}>
                {new Date().toLocaleDateString('es-MX', { weekday: 'long' })}
              </Text>
              <Text fw={800} size="xl" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* ========================================================================= */}
        {/* CARDS DE ESTADÍSTICAS (KPIs ANIMADOS Y FLOTANTES) */}
        {/* ========================================================================= */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {data?.stats && (
            <>
              <PremiumStatCard 
                title="Alumnos Totales" 
                value={data.stats.total_alumnos} 
                icon={<Users size={24} />} 
                color="blue" 
                description="Matrícula activa en USAER"
              />
              <PremiumStatCard 
                title="Escuelas Regular" 
                value={data.stats.total_escuelas} 
                icon={<School size={24} />} 
                color="teal" 
                description="Centros de atención vinculados"
              />
              <PremiumStatCard 
                title="Plantilla Docente" 
                value={data.stats.total_maestros} 
                icon={<ClipboardCheck size={24} />} 
                color="indigo" 
                description="Especialistas y apoyo activo"
              />
            </>
          )}
          <PremiumStatCard 
              title="Incidencias Pend." 
              value={data?.incidencias_pendientes || 0} 
              icon={<AlertCircle size={24} />} 
              color="red" 
              description="Requieren atención inmediata"
              highlight={data?.incidencias_pendientes > 0}
              pulse
          />
        </SimpleGrid>

        {/* ========================================================================= */}
        {/* SECCIÓN INFORMATIVA (FEED DE AVISOS Y GRÁFICAS ELEGANTES) */}
        {/* ========================================================================= */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          
          {/* PANEL DE AVISOS */}
          <Paper p="xl" radius="lg" withBorder shadow="xs">
            <Group justify="space-between" mb="lg">
              <Stack gap={2}>
                <Title order={3} fw={800}>Tablón de Avisos</Title>
                <Text size="xs" c="dimmed">Notificaciones oficiales de la dirección</Text>
              </Stack>
              <Badge variant="light" color="blue" size="lg" radius="md">
                {data?.ultimos_avisos?.length || 0} publicaciones
              </Badge>
            </Group>

            <Divider mb="md" />

            <ScrollArea h={380} scrollbarSize={6} type="hover">
              <Stack gap="md" pr="xs">
                {data?.ultimos_avisos && data.ultimos_avisos.length > 0 ? (
                  data.ultimos_avisos.map((aviso: any) => (
                    <Paper 
                      key={aviso.id} 
                      p="md" 
                      radius="md" 
                      withBorder 
                      bg="gray.0"
                      style={{ 
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        borderLeft: '4px solid var(--mantine-color-blue-6)',
                        cursor: 'pointer'
                      }}
                      className="hover:shadow-sm hover:-translate-x-1"
                    >
                      <Group justify="space-between" align="flex-start" mb="xs">
                        <Text fw={700} size="sm" c="blue.9">{aviso.titulo}</Text>
                        <Badge size="xs" variant="light" color="gray">
                          {new Date(aviso.fecha).toLocaleDateString()}
                        </Badge>
                      </Group>
                      <Text size="xs" c="gray.7" mb="md" style={{ lineHeight: 1.4 }}>
                        {aviso.contenido}
                      </Text>
                      <Group gap="xs">
                        <Avatar radius="xl" size="xs" color="blue">{aviso.autor.charAt(0).toUpperCase()}</Avatar>
                        <Text size="xs" fw={600} c="gray.6">{aviso.autor}</Text>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Center h={200}>
                    <Text c="dimmed" size="sm">No hay avisos recientes por ahora.</Text>
                  </Center>
                )}
              </Stack>
            </ScrollArea>
          </Paper>

          {/* PANEL DE CLASIFICACIONES DE ALUMNOS */}
          <Paper p="xl" radius="lg" withBorder shadow="xs">
            <Stack gap={2} mb="lg">
              <Title order={3} fw={800}>Distribución de Matrícula</Title>
              <Text size="xs" c="dimmed">Alumnos activos clasificados por condición o discapacidad</Text>
            </Stack>

            <Divider mb="md" />

            <Stack gap="lg" style={{ height: '380px', justifyContent: 'center' }}>
              {data?.grafica_clasificacion?.map((item: any, idx: number) => {
                const colors = ['blue', 'teal', 'violet', 'orange', 'red', 'indigo'];
                const colorAssigned = colors[idx % colors.length];
                const percentage = ((item.total / (data.stats?.total_alumnos || 1)) * 100).toFixed(0);

                return (
                  <Box key={item.clasificacion}>
                    <Group justify="space-between" mb={4}>
                      <Group gap="xs">
                        <ThemeIcon size={8} radius="xl" color={colorAssigned} />
                        <Text size="xs" fw={700} c="gray.8" style={{ textTransform: 'capitalize' }}>
                          {item.clasificacion.replace('_', ' ').toLowerCase()}
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Text size="xs" fw={800}>{item.total}</Text>
                        <Text size="xs" c="dimmed">({percentage}%)</Text>
                      </Group>
                    </Group>
                    <Progress 
                      value={item.total} 
                      max={data.stats?.total_alumnos || 100} 
                      color={colorAssigned} 
                      size="sm" 
                      radius="xl"
                      animated
                    />
                  </Box>
                );
              })}
              {(!data?.grafica_clasificacion || data.grafica_clasificacion.length === 0) && (
                <Center h={200}><Text c="dimmed" size="sm">No hay datos de distribución disponibles.</Text></Center>
              )}
            </Stack>
          </Paper>

        </SimpleGrid>
      </Stack>
    </Container>
  );
};

// =========================================================================
// COMPONENTE PREMIUM STAT CARD (DISEÑADOR EXPERTO)
// =========================================================================
const PremiumStatCard = ({ title, value, icon, color, description, highlight = false, pulse = false }: any) => (
  <Paper 
    p="lg" 
    radius="lg" 
    withBorder 
    shadow="xs"
    style={{ 
      backgroundColor: highlight ? `var(--mantine-color-${color}-0)` : 'white',
      borderLeft: highlight ? `4px solid var(--mantine-color-${color}-filled)` : '1px solid var(--mantine-color-gray-2)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    className="hover:shadow-md hover:-translate-y-1 group"
  >
    {/* Micro-indicador decorativo de link */}
    <div style={{
      position: 'absolute',
      right: '12px',
      top: '12px',
      opacity: 0,
      transition: 'opacity 0.2s ease'
    }} className="group-hover:opacity-40">
      <ArrowUpRight size={16} />
    </div>

    <Group wrap="nowrap" align="flex-start">
      <ThemeIcon 
        color={color} 
        variant="light" 
        size={46} 
        radius="lg"
        style={{
          boxShadow: 'var(--mantine-shadow-xs)',
          animation: pulse ? 'pulse 2s infinite' : 'none'
        }}
      >
        {icon}
      </ThemeIcon>
      <Stack gap={2} style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" fw={700} tt="uppercase" lts={0.5}>
          {title}
        </Text>
        <Text size="2xl" fw={900} style={{ fontSize: '1.8rem', lineHeight: 1 }}>
          {value}
        </Text>
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
          {description}
        </Text>
      </Stack>
    </Group>

    {/* Estilos CSS Inline clave para efectos del diseñador */}
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 49, 49, 0.4); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(224, 49, 49, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 49, 49, 0); }
      }
      .hover\\:-translate-y-1:hover {
        transform: translateY(-4px);
      }
      .hover\\:shadow-md:hover {
        box-shadow: var(--mantine-shadow-md) !important;
      }
      .hover\\:-translate-x-1:hover {
        transform: translateX(-4px);
      }
    `}} />
  </Paper>
);

export default Dashboard;