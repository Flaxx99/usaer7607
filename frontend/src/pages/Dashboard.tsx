import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, School, ClipboardCheck, AlertCircle,
  UserCheck, FileText, ArrowUpRight, Calendar,
  ClipboardList, UserPlus, Clock, Activity
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

      {/* KPI STATS — 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Alumnos" 
          value={data?.stats?.total_alumnos ?? 0} 
          icon={<Users className="w-5 h-5" />} 
          color="blue" 
          description="Matrícula activa"
        />
        <StatCard 
          title="Escuelas" 
          value={data?.stats?.total_escuelas ?? 0} 
          icon={<School className="w-5 h-5" />} 
          color="teal" 
          description="Centros vinculados"
        />
        <StatCard 
          title="Maestros Apoyo" 
          value={data?.stats?.total_maestros ?? 0} 
          icon={<ClipboardCheck className="w-5 h-5" />} 
          color="indigo" 
          description="Plantilla activa"
        />
        <StatCard 
          title="Usuarios" 
          value={data?.stats?.total_usuarios ?? 0} 
          icon={<UserPlus className="w-5 h-5" />} 
          color="blue" 
          description="Personal registrado"
        />
        <StatCard 
          title="RACs Pendientes" 
          value={data?.racs_pendientes ?? 0} 
          icon={<ClipboardList className="w-5 h-5" />} 
          color="warning" 
          description="Alumnos sin RAC este ciclo"
          highlight={(data?.racs_pendientes ?? 0) > 0}
          pulse={(data?.racs_pendientes ?? 0) > 0}
        />
        <StatCard 
          title="Incidencias" 
          value={data?.incidencias_pendientes ?? 0} 
          icon={<AlertCircle className="w-5 h-5" />} 
          color="error" 
          description="Requieren atención"
          highlight={(data?.incidencias_pendientes ?? 0) > 0}
          pulse={(data?.incidencias_pendientes ?? 0) > 0}
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Avisos + Actividad */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TABLÓN DE AVISOS */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Tablón de Avisos
                  </h3>
                  <p className="text-xs text-base-content/60">Notificaciones oficiales de la dirección</p>
                </div>
                <Link to="/avisos" className="btn btn-ghost btn-xs text-primary">
                  Ver todos <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3">
                {data?.ultimos_avisos && data.ultimos_avisos.length > 0 ? (
                  data.ultimos_avisos.map((aviso: Aviso) => (
                    <div 
                      key={aviso.id} 
                      className="card bg-base-200 hover:bg-base-300 transition-all border-l-4 border-primary shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-primary">
                            {aviso.titulo}
                          </h4>
                          <span className="badge badge-ghost badge-xs opacity-60 shrink-0">
                            {new Date(aviso.fecha).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/70 mt-1 leading-relaxed line-clamp-2">
                          {aviso.contenido}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
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
                  <div className="flex flex-col items-center justify-center h-32 text-base-content/40 italic text-sm">
                    <FileText size={24} className="mb-2 opacity-30" />
                    No hay avisos recientes por ahora.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MI ACTIVIDAD RECIENTE */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Mi Actividad Reciente</h3>
              </div>

              <div className="space-y-2">
                {data?.actividad_reciente && data.actividad_reciente.length > 0 ? (
                  data.actividad_reciente.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/70 hover:bg-base-200 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <ClipboardList size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{act.descripcion}</p>
                        <p className="text-xs text-base-content/50">
                          {new Date(act.fecha).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {act.url && (
                        <Link to={act.url} className="btn btn-ghost btn-xs">
                          <ArrowUpRight size={14} />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-base-content/40 italic text-sm">
                    <Activity size={20} className="mb-1 opacity-30" />
                    Todavía no hay actividad registrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Eventos + Gráfica */}
        <div className="space-y-6">

          {/* EVENTOS DE HOY */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Hoy</h3>
              </div>

              <div className="space-y-2">
                {data?.eventos_hoy && data.eventos_hoy.length > 0 ? (
                  data.eventos_hoy.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/70">
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color || '#3B82F6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={12} className="text-base-content/40" />
                          <span className="text-xs text-base-content/50">{ev.hora}</span>
                          <span className="badge badge-ghost badge-xs">{ev.event_type}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-base-content/40 italic text-sm">
                    <Calendar size={20} className="mb-1 opacity-30" />
                    Sin eventos para hoy.
                  </div>
                )}
              </div>

              <Link to="/agenda" className="btn btn-ghost btn-xs w-full mt-3 text-primary">
                Ver agenda completa <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* DISTRIBUCIÓN DE MATRÍCULA */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-primary" />
                Distribución por Condición
              </h3>

              <div className="h-[250px] w-full">
                {data?.grafica_clasificacion && data.grafica_clasificacion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.grafica_clasificacion} layout="vertical" margin={{ left: 30, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-base-300)" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="clasificacion" 
                        type="category" 
                        tick={{ fontSize: 10, fontWeight: 600 }} 
                        width={80}
                        tickFormatter={(val) => val.replace('_', ' ').toLowerCase()}
                      />
                      <Tooltip 
                        cursor={{ fill: 'var(--color-base-200)' }} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
                        {data.grafica_clasificacion.map((_entry: unknown, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-base-content/40 italic text-sm">
                    Sin datos disponibles.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const COLOR_PALETTE = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-primary/10 text-primary border-primary/20',
  teal: 'bg-accent/10 text-accent border-accent/20',
  indigo: 'bg-secondary/10 text-secondary border-secondary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
};

const StatCard = ({ title, value, icon, color, description, highlight = false, pulse = false }: StatCardProps) => {
  return (
    <div 
      className={`card bg-base-100 shadow-sm border transition-all duration-200 group hover:shadow-md hover:-translate-y-1 ${
        highlight ? 'border-l-4 border-l-warning' : 'border-base-300'
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${COLOR_CLASSES[color] || 'bg-base-200'} ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="mt-3">
          <h4 className="text-2xl font-black">{value}</h4>
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mt-0.5">
            {title}
          </p>
          <p className="text-[10px] text-base-content/50 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
