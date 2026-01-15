import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { 
  Users, School, ClipboardCheck, AlertCircle, Loader2, 
  Calendar, UserCheck, FileText 
} from 'lucide-react';
import { getDashboardData } from '../api/dashboard';

// --- DICCIONARIO DE ROLES (Traducción BD -> Humano) ---
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
  // --- 1. LÓGICA DE USUARIO (LOCALSTORAGE) ---
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
        
        // A) LÓGICA DE NOMBRE ROBUSTA
        // Intentamos armar el nombre más bonito posible
        let nombreFinal = user.email ? user.email.split('@')[0] : 'Usuario'; // Fallback básico

        if (user.nombre_completo) {
            nombreFinal = user.nombre_completo;
        } else if ((user.nombre || user.first_name) && (user.apellido_paterno || user.last_name)) {
            // Unimos nombre y apellido (soportando keys de Django default o custom)
            const n = user.nombre || user.first_name || '';
            const a = user.apellido_paterno || user.last_name || '';
            nombreFinal = `${n} ${a}`.trim();
        } else if (user.username) {
            nombreFinal = user.username;
        }

        // B) LÓGICA DE ROL (USANDO EL DICCIONARIO)
        // Buscamos el código (ej. 'TRAB_SOCIAL') en el mapa.
        // Si no existe, mostramos "Personal USAER" por defecto.
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

  // --- 2. LÓGICA DE DATOS DEL DASHBOARD (API) ---
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    retry: 1,
  });

  // Manejo de carga
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
        <span className="text-text-secondary font-medium">Cargando indicadores...</span>
      </div>
    );
  }

  // Manejo de error
  if (isError) {
    console.error("Error dashboard:", error);
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 mt-6">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-bold">No se pudo cargar la información</h3>
            <p className="text-sm">Verifique su conexión o intente más tarde.</p>
        </div>
    );
  }

  // --- 3. RENDERIZADO FINAL ---
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECCIÓN A: CREDENCIAL DE USUARIO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar con Inicial */}
        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-primary text-2xl font-bold border-4 border-white shadow-md">
           {(userData.nombre || 'U').charAt(0).toUpperCase()}
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-text-main">Hola, {userData.nombre}</h1>
          <p className="text-text-secondary flex items-center justify-center md:justify-start gap-2 mt-1">
            <UserCheck size={16} className="text-green-500" />
            <span className="font-medium text-slate-700">{userData.rol}</span>
          </p>
          <div className="mt-2 flex gap-2 justify-center md:justify-start">
             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                {userData.email || 'Sin correo'}
             </span>
             <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 font-medium">
                USAER 7607
             </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-right border-l border-slate-100 pl-6">
            <p className="text-sm text-text-secondary flex items-center gap-1">
                <Calendar size={14} /> Hoy es
            </p>
            <p className="text-lg font-bold text-text-main capitalize">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>

      {/* SECCIÓN B: TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Estadísticas Generales (Solo si el backend las manda en 'stats') */}
        {data?.stats && (
            <>
                <StatCard 
                    title="Alumnos Totales" 
                    value={data.stats.total_alumnos} 
                    icon={<Users className="text-blue-600" />} 
                    color="bg-blue-50" 
                />
                <StatCard 
                    title="Escuelas" 
                    value={data.stats.total_escuelas} 
                    icon={<School className="text-emerald-600" />} 
                    color="bg-emerald-50" 
                />
                <StatCard 
                    title="Usuarios" 
                    value={data.stats.total_usuarios} 
                    icon={<ClipboardCheck className="text-indigo-600" />} 
                    color="bg-indigo-50" 
                />
            </>
        )}
        
        {/* Estadísticas Operativas (Siempre visibles) */}
        <StatCard 
            title="Incidencias Pend." 
            value={data?.incidencias_pendientes || 0} 
            icon={<AlertCircle className="text-rose-600" />} 
            color="bg-rose-50" 
        />
         <StatCard 
            title="Permisos Pend." 
            value={data?.permisos_pendientes || 0} 
            icon={<FileText className="text-amber-600" />} 
            color="bg-amber-50" 
        />
      </div>

      {/* SECCIÓN C: AVISOS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            Avisos Recientes
            <span className="text-xs font-normal text-text-secondary bg-slate-100 px-2 py-1 rounded-full">
                {data?.ultimos_avisos?.length || 0} nuevos
            </span>
        </h3>
        
        <div className="space-y-4">
          {data?.ultimos_avisos && data.ultimos_avisos.length > 0 ? (
            data.ultimos_avisos.map((aviso: any) => (
                <div key={aviso.id} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg hover:bg-blue-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-blue-900">{aviso.titulo}</p>
                        <span className="text-xs text-blue-600 font-medium bg-white px-2 py-0.5 rounded-full">
                            {new Date(aviso.fecha).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">{aviso.contenido}</p>
                    <p className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1">
                        <UserCheck size={12} /> {aviso.autor}
                    </p>
                </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
                <p>No hay avisos recientes por ahora.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente pequeño reutilizable
const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-text-secondary font-medium">{title}</p>
      <p className="text-2xl font-bold text-text-main">{value}</p>
    </div>
  </div>
);

export default Dashboard;