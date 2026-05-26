import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, School, Calendar, 
  Settings, AlertTriangle, FileCheck, Mail, Megaphone, 
  FolderOpen, ClipboardList, BookOpen, Clock, Layers, LogOut
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  AppShell, 
  Burger, 
  NavLink, 
  Group, 
  Text, 
  Avatar, 
  Button, 
  Box,
  Stack
} from '@mantine/core';

// 1. DICCIONARIO DE ROLES (Visual)
const ROLES_MAP: Record<string, string> = {
    'DIRECTOR': 'Director(a)',
    'MAESTRO_APOYO': 'Maestro(a) Apoyo',
    'TRAB_SOCIAL': 'Trab. Social',
    'PSICOLOGO': 'Psicólogo(a)',
    'PSICOMOTRICIDAD': 'Psicomotricidad',
    'COMUNICACION': 'Comunicación',
    'TRAB_MANUAL': 'Trab. Manual',
    'SECRETARIO': 'Secretario(a)',
    'ADMIN': 'Administrador',
    'ADMINISTRADOR': 'Administrador'
};

// 2. CONSTANTES DE AGRUPACIÓN
const ROL_ADMIN_TOTAL = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO'];
const ROL_DOCENTE = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO', 'MAESTRO_APOYO'];
const ROL_ESPECIALISTA = ['PSICOLOGO', 'TRAB_SOCIAL', 'COMUNICACION', 'PSICOMOTRICIDAD'];
const ROL_TODOS_TECNICOS = [...ROL_DOCENTE, ...ROL_ESPECIALISTA]; 

// 3. CONFIGURACIÓN MAESTRA DEL MENÚ
const MENU_CONFIG = [
    { label: 'Panel Principal', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['ALL'] },
    { label: 'Avisos', path: '/avisos', icon: <Megaphone size={20} />, roles: ['ALL'] },
    { label: 'Usuarios', path: '/usuarios', icon: <Settings size={20} />, roles: ['ADMIN', 'ADMINISTRADOR'] },
    { label: 'Ciclos Escolares', path: '/ciclos', icon: <Layers size={20} />, roles: ROL_ADMIN_TOTAL },
    { label: 'Escuelas', path: '/escuelas', icon: <School size={20} />, roles: ROL_ADMIN_TOTAL },
    { label: 'Alumnos', path: '/alumnos', icon: <Users size={20} />, roles: ROL_DOCENTE },
    { label: 'R.A.C.', path: '/rac', icon: <ClipboardList size={20} />, roles: ROL_DOCENTE },
    { label: 'R.A.E.', path: '/rae', icon: <BookOpen size={20} />, roles: ROL_DOCENTE },
    { label: 'Documentos', path: '/documentos', icon: <FolderOpen size={20} />, roles: [...ROL_TODOS_TECNICOS, 'TRAB_MANUAL'] },
    { label: 'Asistencias', path: '/asistencias', icon: <Clock size={20} />, roles: ['ALL'] },
    { label: 'Permisos', path: '/permisos', icon: <FileCheck size={20} />, roles: ['ALL'] },
    { label: 'Incidencias', path: '/incidencias', icon: <AlertTriangle size={20} />, roles: ['ALL'] },
    { label: 'Oficios', path: '/oficios', icon: <Mail size={20} />, roles: ROL_ADMIN_TOTAL },
    { label: 'Agenda / Calendario', path: '/agenda', icon: <Calendar size={20} />, roles: ['ALL'] },
];

const MainLayout = () => {
  const [opened, setOpened] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userRol, setUserRol] = useState('');
  const [userRoleCode, setUserRoleCode] = useState('');
  const [isSuperUser, setIsSuperUser] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        let nombre = 'Usuario';
        if (user.first_name || user.last_name) {
             nombre = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.username) {
            nombre = user.username;
        }
        const rolCodigo = user.role || '';
        let rolBonito = ROLES_MAP[rolCodigo] || 'Personal USAER';
        if (user.is_superuser) rolBonito = 'Administrador (Super)';

        setUserName(nombre);
        setUserRol(rolBonito);
        setUserRoleCode(rolCodigo);
        setIsSuperUser(user.is_superuser || false);
      } catch (e) {
        console.error("Error leyendo usuario", e);
      }
    }
  }, []);

  const filteredMenuItems = MENU_CONFIG.filter(item => {
    if (isSuperUser) return true;
    if (item.roles.includes('ALL')) return true;
    return item.roles.includes(userRoleCode);
  });

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Tendrás que ingresar tus credenciales nuevamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/login');
      }
    });
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ 
        width: 260, 
        breakpoint: 'sm', 
        collapsed: { mobile: !opened } 
      }}
      padding="md"
    >
      <AppShell.Header p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg" c="blue">USAER <Text span c="gray">7607</Text></Text>
          </Group>
          
          <Button 
            variant="subtle" 
            color="red" 
            leftSection={<LogOut size={16} />} 
            onClick={handleLogout}
            size="xs"
          >
            Cerrar Sesión
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" pl="sm" mb="xs">
            Menú Principal
          </Text>
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              component={Link} 
              to={item.path}
              label={item.label}
              leftSection={item.icon}
              active={location.pathname.startsWith(item.path)}
              variant="filled"
              color="blue"
              radius="md"
              onClick={() => setOpened(false)}
              style={{ borderRadius: '12px' }}
            />
          ))}
        </Stack>

        <Box 
          style={{ 
            position: 'absolute', 
            bottom: '20px', 
            left: '20px', 
            right: '20px',
            padding: '12px',
            backgroundColor: 'var(--mantine-color-gray-0)',
            borderRadius: '12px',
            border: '1px solid var(--mantine-color-gray-2)'
          }}
        >
          <Group wrap="nowrap">
            <Avatar src="" radius="xl" color="blue">{userName.charAt(0).toUpperCase()}</Avatar>
            <div style={{ overflow: 'hidden' }}>
              <Text size="sm" fw={600} truncate>{userName}</Text>
              <Text size="xs" c="dimmed" truncate>{userRol}</Text>
            </div>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default MainLayout;