import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, LogOut, 
  LayoutDashboard, Users, School, Calendar, 
  Settings, AlertTriangle, FileCheck, Mail, Megaphone, 
  FolderOpen, ClipboardList, BookOpen, Clock, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';

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
    // --- PRINCIPAL ---
    { 
        label: 'Panel Principal', 
        path: '/dashboard', 
        icon: <LayoutDashboard size={20} />, 
        roles: ['ALL'] 
    },
    { 
        label: 'Avisos', 
        path: '/avisos', 
        icon: <Megaphone size={20} />, 
        roles: ['ALL'] 
    },

    // --- ADMINISTRACIÓN DEL SISTEMA ---
    { 
        label: 'Usuarios', 
        path: '/usuarios', 
        icon: <Settings size={20} />, 
        // CORRECCIÓN: Aceptamos ambas variantes para asegurar que se vea
        roles: ['ADMIN', 'ADMINISTRADOR'] 
    },
    { 
        label: 'Ciclos Escolares', 
        path: '/ciclos', 
        icon: <Layers size={20} />, 
        roles: ROL_ADMIN_TOTAL 
    },
    { 
        label: 'Escuelas', 
        path: '/escuelas', 
        icon: <School size={20} />, 
        roles: ROL_ADMIN_TOTAL 
    },

    // --- PEDAGÓGICO (DOCENTES USAER) ---
    { 
        label: 'Alumnos', 
        path: '/alumnos', 
        icon: <Users size={20} />, 
        roles: ROL_DOCENTE 
    },
    { 
        label: 'R.A.C.', 
        path: '/rac', 
        icon: <ClipboardList size={20} />, 
        roles: ROL_DOCENTE 
    },
    { 
        label: 'R.A.E.', 
        path: '/rae', 
        icon: <BookOpen size={20} />, 
        roles: ROL_DOCENTE 
    },

    // --- DOCUMENTOS / EXPEDIENTES ---
    { 
        label: 'Documentos', 
        path: '/documentos', 
        icon: <FolderOpen size={20} />, 
        roles: [...ROL_TODOS_TECNICOS, 'TRAB_MANUAL'] 
    },

    // --- TRÁMITES ADMINISTRATIVOS ---
    { 
        label: 'Asistencias', 
        path: '/asistencias', 
        icon: <Clock size={20} />, 
        roles: ['ALL'] 
    },
    { 
        label: 'Permisos', 
        path: '/permisos', 
        icon: <FileCheck size={20} />, 
        roles: ['ALL'] 
    },
    { 
        label: 'Incidencias', 
        path: '/incidencias', 
        icon: <AlertTriangle size={20} />, 
        roles: ['ALL'] 
    },
    { 
        label: 'Oficios', 
        path: '/oficios', 
        icon: <Mail size={20} />, 
        roles: ['ALL'] 
    },

    // --- HERRAMIENTAS ---
    { 
        label: 'Agenda / Calendario', 
        path: '/agenda', 
        icon: <Calendar size={20} />, 
        roles: ['ALL'] 
    },
];

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados de Usuario
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
        
        // A) Nombre
        let nombre = 'Usuario';
        if (user.first_name || user.last_name) {
             nombre = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.username) {
             nombre = user.username;
        }

        // B) Rol
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

  // FILTRADO DEL MENÚ
  const filteredMenuItems = MENU_CONFIG.filter(item => {
    // 1. Si es Superusuario, ve todo.
    if (isSuperUser) return true;

    // 2. Si el menú es para todos, pasa.
    if (item.roles.includes('ALL')) return true;
    
    // 3. Comparación estricta de roles
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
    <div className="min-h-screen bg-background flex">
      
      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* LOGO */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-bold text-primary tracking-tight">USAER <span className="text-text-main font-light">7607</span></h1>
        </div>

        {/* MENÚ SCROLLABLE */}
        <nav className="p-4 space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div 
                key={item.path}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-blue-50 text-primary shadow-sm ring-1 ring-blue-100' 
                    : 'text-text-secondary hover:bg-slate-50 hover:text-text-main'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* FOOTER PERFIL */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold shadow-sm border-2 border-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-text-main truncate" title={userName}>
                {userName}
              </p>
              <p className="text-xs text-text-secondary truncate font-medium bg-slate-200/50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                {userRol}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/30">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-semibold text-text-main hidden md:flex items-center gap-2">
               <span className="w-2 h-6 bg-primary rounded-full"></span>
               Gestión Escolar
            </h2>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-2 rounded-lg transition-all text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};

export default MainLayout;