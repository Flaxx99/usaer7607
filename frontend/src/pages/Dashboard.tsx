import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, School, ClipboardCheck, AlertCircle,
  UserCheck, FileText, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { DashboardSkeleton, ErrorState } from '../components/Skeletons';
import { getDashboardData } from '../api/dashboard';
import type { Aviso, StatCardProps } from '../interfaces/dashboard';

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

const loadUserData = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return { nombre: 'Usuario', rol: 'Cargando...', email: '' };
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
    return { nombre: nombreFinal, rol: rolMostrar, email: user.email || '' };
  } catch {
    return { nombre: 'Usuario', rol: 'Cargando...', email: '' };
  }
};

const Dashboard = () => {
  const [userData] = useState(loadUserData);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    retry: 1,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      
      {/* HEADER HERO */}
      <div className="card bg-gradient-to-br from-primary to-indigo-700 text-primary-content shadow-xl overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        
        <div className="card-body p-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full ring-4 ring-white/30 bg-white/20 flex items-center justify-center text-2xl font-bold shadow-inner">
                  {userData.nombre.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  ¡Hola, {userData.nombre}!
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="font-medium opacity-90">{userData.rol}</span>
                  <div className="badge badge-secondary badge-sm font-bold">
                    {data?.ciclo_actual || 'Ciclo Escolar'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block text-right opacity-90">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long' })}
              </p>
              <p className="text-2xl font-black">
                {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.stats && (
          <>
            <StatCard 
              title="Alumnos Totales" 
              value={data.stats.total_alumnos} 
              icon={<Users className="w-6 h-6" />} 
              color="blue" 
              description="Matrícula activa en USAER"
            />
            <StatCard 
              title="Escuelas Regular" 
              value={data.stats.total_escuelas} 
              icon={<School className="w-6 h-6" />} 
              color="teal" 
              description="Centros de atención vinculados"
            />
            <StatCard 
              title="Plantilla Docente" 
              value={data.stats.total_maestros} 
              icon={<ClipboardCheck className="w-6 h-6" />} 
              color="indigo" 
              description="Especialistas y apoyo activo"
            />
          </>
        )}
        <StatCard 
            title="Incidencias Pend." 
            value={data?.incidencias_pendientes || 0} 
            icon={<AlertCircle className="w-6 h-6" />} 
            color="error" 
            description="Requieren atención inmediata"
            highlight={(data?.incidencias_pendientes ?? 0) > 0}
            pulse={(data?.incidencias_pendientes ?? 0) > 0}
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANEL DE AVISOS */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Tablón de Avisos
                </h3>
                <p className="text-xs text-base-content/60">Notificaciones oficiales de la dirección</p>
              </div>
              <div className="badge badge-primary badge-outline font-bold">
                {data?.ultimos_avisos?.length || 0} publicaciones
              </div>
            </div>

            <div className="divider my-0"></div>

            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mt-4">
              {data?.ultimos_avisos && data.ultimos_avisos.length > 0 ? (
                data.ultimos_avisos.map((aviso: Aviso) => (
                  <div 
                    key={aviso.id} 
                    className="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer group border-l-4 border-primary shadow-sm"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-primary group-hover:text-primary-focus transition-colors">
                          {aviso.titulo}
                        </h4>
                        <span className="badge badge-ghost badge-xs opacity-60">
                          {new Date(aviso.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                        {aviso.contenido}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-5 h-5 text-xs">
                            {aviso.autor.charAt(0).toUpperCase()}
                          </div>
                        </div>
                            <span className="text-xs font-semibold opacity-60">{aviso.autor}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-base-content/40 italic text-sm">
                  No hay avisos recientes por ahora.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DE DISTRIBUCIÓN (GRÁFICA) */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Distribución de Matrícula
              </h3>
              <p className="text-xs text-base-content/60">Alumnos activos clasificados por condición</p>
            </div>

            <div className="divider my-0"></div>

            <div className="h-[350px] w-full mt-4">
              {data?.grafica_clasificacion && data.grafica_clasificacion.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.grafica_clasificacion} layout="vertical" margin={{ left: 40, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="clasificacion" 
                      type="category" 
                      tick={{ fontSize: 11, fontWeight: 600 }} 
                      width={100}
                      tickFormatter={(val) => val.replace('_', ' ').toLowerCase()}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                      {data.grafica_clasificacion.map((_entry: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-base-content/40 italic text-sm">
                  No hay datos de distribución disponibles.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const COLOR_PALETTE = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

const StatCard = ({ title, value, icon, color, description, highlight = false, pulse = false }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    error: 'bg-error/10 text-error border-error/20',
  };

  return (
    <div 
      className={`card bg-base-100 shadow-sm border transition-all duration-200 cursor-pointer group hover:shadow-md hover:-translate-y-1 ${
        highlight ? 'border-l-4 border-l-error' : 'border-base-300'
      }`}
    >
      <div className="card-body p-5">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-base-200'} ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">
            {title}
          </p>
          <h4 className="text-3xl font-black mt-1">{value}</h4>
          <p className="text-xs text-base-content/60 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
