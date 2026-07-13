import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, School, Calendar, 
  Settings, AlertTriangle, FileCheck, Mail, Megaphone, 
  FolderOpen, ClipboardList, BookOpen, Clock, Layers, LogOut, Menu, X, Bell,
  Sun, Moon
} from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { getUnreadNotificationCount } from '../api/notificaciones';
import NotificacionBell from '../pages/notificaciones/NotificacionBell';
import type { RACPendientesResponse } from '../interfaces/api';

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

const ROL_ADMIN_TOTAL = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO'];
const ROL_DOCENTE = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO', 'MAESTRO_APOYO'];
const ROL_ESPECIALISTA = ['PSICOLOGO', 'TRAB_SOCIAL', 'COMUNICACION', 'PSICOMOTRICIDAD'];
const ROL_TODOS_TECNICOS = [...ROL_DOCENTE, ...ROL_ESPECIALISTA]; 

const MENU_CONFIG = [
    { label: 'Panel Principal', path: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    { label: 'Avisos', path: '/avisos', icon: Megaphone, roles: ['ALL'] },
    { label: 'Usuarios', path: '/usuarios', icon: Settings, roles: ['ADMIN', 'ADMINISTRADOR'] },
    { label: 'Ciclos Escolares', path: '/ciclos', icon: Layers, roles: ROL_ADMIN_TOTAL },
    { label: 'Escuelas', path: '/escuelas', icon: School, roles: ROL_ADMIN_TOTAL },
    { label: 'Alumnos', path: '/alumnos', icon: Users, roles: ROL_DOCENTE },
    { label: 'R.A.C.', path: '/rac', icon: ClipboardList, roles: ROL_DOCENTE },
    { label: 'R.A.E.', path: '/rae', icon: BookOpen, roles: ROL_DOCENTE },
    { label: 'Documentos', path: '/documentos', icon: FolderOpen, roles: [...ROL_TODOS_TECNICOS, 'TRAB_MANUAL'] },
    { label: 'Asistencias', path: '/asistencias', icon: Clock, roles: ['ALL'] },
    { label: 'Permisos', path: '/permisos', icon: FileCheck, roles: ['ALL'] },
    { label: 'Incidencias', path: '/incidencias', icon: AlertTriangle, roles: ['ALL'] },
    { label: 'Oficios', path: '/oficios', icon: Mail, roles: ROL_ADMIN_TOTAL },
    { label: 'Agenda / Calendario', path: '/agenda', icon: Calendar, roles: ['ALL'] },
    { label: 'Notificaciones', path: '/notificaciones', icon: Bell, roles: ['ALL'] },
  ];


const loadUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return { userName: 'Usuario', userRol: '', userRoleCode: '', isSuperUser: false };
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
    return { userName: nombre, userRol: rolBonito, userRoleCode: rolCodigo, isSuperUser: user.is_superuser || false };
  } catch {
    return { userName: 'Usuario', userRol: '', userRoleCode: '', isSuperUser: false };
  }
};

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName] = useState(() => loadUserFromStorage().userName);
  const [userRol] = useState(() => loadUserFromStorage().userRol);
  const [userRoleCode] = useState(() => loadUserFromStorage().userRoleCode);
  const [isSuperUser] = useState(() => loadUserFromStorage().isSuperUser);

  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const navigate = useNavigate();
  const location = useLocation();

  const { data: racPendientes } = useQuery({
      queryKey: ['rac_pendientes'],
      queryFn: async () => {
          const res = await client.get('/rac/pendientes/');
          return res.data as RACPendientesResponse;
      },
      refetchInterval: 60_000,
      enabled: !!userRoleCode && (userRoleCode === 'ADMIN' || userRoleCode === 'SECRETARIO' || userRoleCode === 'MAESTRO_APOYO'),
  });

  const racBadgeCount = racPendientes?.total_pendientes ?? 0;

  const { data: notifConteo } = useQuery({
      queryKey: ['notificaciones', 'conteo'],
      queryFn: getUnreadNotificationCount,
      refetchInterval: 30_000,
      enabled: !!userRoleCode,
  });

  const notifBadgeCount = notifConteo?.unread_count ?? 0;

  const filteredMenuItems = MENU_CONFIG.filter(item => {
    if (isSuperUser) return true;
    if (item.roles.includes('ALL')) return true;
    return item.roles.includes(userRoleCode);
  });

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión? Tendrás que ingresar tus credenciales nuevamente.')) {
      const refreshToken = localStorage.getItem('refresh_token');
      // Llamada asíncrona al backend para blacklistear el refresh token
      if (refreshToken) {
        fetch(`${import.meta.env.VITE_API_URL}/usuarios/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        }).catch(() => { /* error silencioso — el token expirará solo */ });
      }
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {/* SKIP LINK */}
      <a 
        href="#main-content"
        className="fixed top-0 left-0 z-[100] -translate-y-full focus:translate-y-0 transition-transform bg-primary text-primary-content font-bold px-4 py-2 rounded-br-lg shadow-lg focus:outline-none"
      >
        Saltar al contenido principal
      </a>
      
      {/* SIDEBAR MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-base-100 border-r border-base-300 
        transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">U</div>
            <span className="text-xl font-black tracking-tight">USAER <span className="text-primary">7607</span></span>
          </div>
<button className="btn btn-ghost btn-xs md:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú">
                <X size={20} aria-hidden="true" />
              </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest px-3 mb-4">
            Menú Principal
          </p>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
               <Link 
                 key={item.path} 
                 to={item.path}
                 className={`
                   flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                   ${isActive 
                     ? 'bg-primary text-white shadow-md shadow-primary/20' 
                     : 'text-base-content/70 hover:bg-base-200 hover:text-primary'}
                 `}
                 onClick={() => setIsSidebarOpen(false)}
                 aria-current={isActive ? 'page' : undefined}
               >
                 <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'} />
                 <span className="text-sm font-semibold flex-1">{item.label}</span>
                  {item.label === 'R.A.C.' && racBadgeCount > 0 && (
                    <span className="badge badge-error badge-xs font-bold animate-pulse">
                      {racBadgeCount > 99 ? '99+' : racBadgeCount}
                    </span>
                  )}
                  {item.label === 'Notificaciones' && notifBadgeCount > 0 && (
                    <span className="badge badge-xs font-bold text-white"
                      style={{ backgroundColor: '#6366F1' }}
                    >
                      {notifBadgeCount > 99 ? '99+' : notifBadgeCount}
                    </span>
                  )}
               </Link>

            );
          })}
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="p-4 border-t border-base-300 bg-base-200/50">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-base-100 border border-base-300 shadow-sm">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10 h-10 font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userName}</p>
              <p className="text-xs opacity-60 truncate">{userRol}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="btn btn-ghost btn-square md:hidden" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} aria-hidden="true" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-sm font-bold opacity-50 uppercase tracking-widest">
                {location.pathname === '/' ? 'Inicio' : MENU_CONFIG.find(i => location.pathname.startsWith(i.path))?.label || 'Sistema'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NotificacionBell />
            <button
              className="btn btn-ghost btn-sm btn-square tooltip"
              onClick={toggleTheme}
              aria-label={theme === 'usaer-dark' ? 'Tema claro' : 'Tema oscuro'}
              title={theme === 'usaer-dark' ? 'Tema claro' : 'Tema oscuro'}
            >
              {theme === 'usaer-dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10" 
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 bg-base-200/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
