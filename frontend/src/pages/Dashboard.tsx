import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, School, ClipboardCheck, AlertCircle,
  UserCheck, FileText, ArrowUpRight, Calendar,
  ClipboardList, Activity, Clock, Sparkles,
  TrendingUp, Target, CheckCircle2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DashboardSkeleton, ErrorState } from '../components/Skeletons';
import { getDashboardData } from '../api/dashboard';
import type {
  Aviso, AsistenciaTrendEntry, EscuelaFilterOption,
  RAEDashboardProgress, StatCardProps,
} from '../interfaces/dashboard';

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

/* ─── COLORS POR STAT ─── */
const STAT_STYLES: Record<string, { gradient: string; iconBg: string; border: string }> = {
  blue:   { gradient: 'from-blue-500/10 to-blue-600/5',  iconBg: 'bg-blue-500/15 text-blue-600',  border: 'border-l-blue-500' },
  teal:   { gradient: 'from-teal-500/10 to-teal-600/5',  iconBg: 'bg-teal-500/15 text-teal-600',  border: 'border-l-teal-500' },
  indigo: { gradient: 'from-indigo-500/10 to-indigo-600/5', iconBg: 'bg-indigo-500/15 text-indigo-600', border: 'border-l-indigo-500' },
  warning: { gradient: 'from-amber-500/10 to-amber-600/5', iconBg: 'bg-amber-500/15 text-amber-600', border: 'border-l-amber-500' },
  error:  { gradient: 'from-rose-500/10 to-rose-600/5',  iconBg: 'bg-rose-500/15 text-rose-600',  border: 'border-l-rose-500' },
};

const Dashboard = () => {
  const [userData] = useState(loadUserData);
  const [filtroEscuela, setFiltroEscuela] = useState('');

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
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 stagger-in">

      {/* ════════════════════════════════════════ */}
      {/* HEADER HERO — Dashboard */}
      {/* ════════════════════════════════════════ */}
      <div className="header-section header-dashboard">
        {/* Patrón decorativo de puntos */}
        <div className="header-pattern" />

        {/* Círculos decorativos */}
        <div className="header-circle header-circle-lg" />
        <div className="header-circle header-circle-sm" />
        <div className="header-circle header-circle-xs" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-5">
              <div className="avatar indicator">
                {data?.racs_pendientes && data.racs_pendientes > 0 && (
                  <span className="indicator-item badge badge-xs badge-secondary animate-gentle-bounce" />
                )}
                <div className="w-20 h-20 rounded-full ring-4 ring-white/25 bg-white/20 flex items-center justify-center text-3xl font-bold shadow-inner backdrop-blur-xs">
                  {userData.nombre.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    ¡Hola, {userData.nombre}!
                  </h1>
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-gentle-bounce" />
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span className="text-sm font-medium opacity-85">{userData.rol}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <div className="badge badge-sm bg-white/15 text-white border-none font-bold">
                    {data?.ciclo_actual || 'Ciclo Escolar'}
                  </div>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long' })}
              </p>
              <p className="text-2xl font-black font-[family-name:Fredoka] leading-tight">
                {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs font-medium opacity-60">
                {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* KPI STATS — 6 Cards con personalidad */}
      {/* ════════════════════════════════════════ */}
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
          icon={<Users className="w-5 h-5" />}
          color="blue"
          description="Personal registrado"
        />
        <StatCard
          title="RACs Pendientes"
          value={data?.racs_pendientes ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="warning"
          description="Sin RAC este ciclo"
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

      {/* ════════════════════════════════════════ */}
      {/* FILTROS — Escuela */}
      {/* ════════════════════════════════════════ */}
      {data?.escuelas_filtro && data.escuelas_filtro.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-base-content/60">
            <School size={15} />
            <span>Filtrar por escuela:</span>
          </div>
          <select
            className="select select-bordered select-sm min-w-[220px]"
            value={filtroEscuela}
            onChange={(e) => setFiltroEscuela(e.target.value)}
          >
            <option value="">Todas las escuelas</option>
            {data.escuelas_filtro.map((esc: EscuelaFilterOption) => (
              <option key={esc.id} value={String(esc.id)}>
                {esc.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* MAIN CONTENT — 2 columnas */}
      {/* ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── COLUMNA IZQUIERDA (2/3) ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* TABLÓN DE AVISOS */}
          <div className="card-paper">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Tablón de Avisos</h3>
                    <p className="text-[11px] text-base-content/50 font-medium">Notificaciones oficiales</p>
                  </div>
                </div>
                <Link to="/avisos" className="btn btn-ghost btn-xs text-primary gap-1">
                  Ver todos <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Lista */}
              <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2.5">
                {data?.ultimos_avisos && data.ultimos_avisos.length > 0 ? (
                  data.ultimos_avisos.map((aviso: Aviso) => (
                    <div key={aviso.id} className="list-card border-l-amber-500">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-base-content line-clamp-1">
                          {aviso.titulo}
                        </h4>
                        <span className="badge badge-ghost badge-xs opacity-50 shrink-0 font-medium">
                          {new Date(aviso.fecha).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/65 mt-1 leading-relaxed line-clamp-2">
                        {aviso.contenido}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-neutral text-neutral-content text-[10px] font-bold flex items-center justify-center">
                          {aviso.autor.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-semibold text-base-content/50">{aviso.autor}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-base-content/40 italic text-sm">
                    <FileText size={22} className="mb-2 opacity-30" />
                    No hay avisos recientes por ahora.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MI ACTIVIDAD RECIENTE */}
          <div className="card-paper">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Mi Actividad Reciente</h3>
                  <p className="text-[11px] text-base-content/50 font-medium">Últimos movimientos en el sistema</p>
                </div>
              </div>

              <div className="space-y-2">
                {data?.actividad_reciente && data.actividad_reciente.length > 0 ? (
                  data.actividad_reciente.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60 hover:bg-base-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ClipboardList size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{act.descripcion}</p>
                        <p className="text-[11px] text-base-content/50 font-medium">
                          {new Date(act.fecha).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {act.url && (
                        <Link to={act.url} className="btn btn-ghost btn-xs btn-square">
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

        {/* ─── COLUMNA DERECHA (1/3) ─── */}
        <div className="space-y-6">

          {/* EVENTOS DE HOY */}
          <div className="card-paper">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Hoy</h3>
                    <p className="text-[11px] text-base-content/50 font-medium">Eventos del día</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {data?.eventos_hoy && data.eventos_hoy.length > 0 ? (
                  data.eventos_hoy.map((ev: Record<string, unknown>, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60">
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: (ev.color as string) || '#3B82F6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{ev.title as string}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={11} className="text-base-content/40 shrink-0" />
                          <span className="text-xs text-base-content/50 font-medium">{ev.hora as string}</span>
                          {(ev.event_type as string) && (
                            <span className="badge badge-ghost badge-xs font-medium">{ev.event_type as string}</span>
                          )}
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

              <Link to="/agenda" className="btn btn-ghost btn-xs w-full mt-4 text-primary gap-1">
                Ver agenda completa <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* DISTRIBUCIÓN DE MATRÍCULA */}
          <div className="card-paper">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Distribución</h3>
                  <p className="text-[11px] text-base-content/50 font-medium">Por condición</p>
                </div>
              </div>

              <div className="h-[220px] w-full">
                {data?.grafica_clasificacion && data.grafica_clasificacion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.grafica_clasificacion} layout="vertical" margin={{ left: 20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-base-300)" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="clasificacion"
                        type="category"
                        tick={{ fontSize: 9, fontWeight: 600 }}
                        width={70}
                        tickFormatter={(val) => val.replace(/_/g, ' ').toLowerCase()}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--color-base-200)' }}
                        contentStyle={{ borderRadius: '12px', border: '2px solid var(--color-base-300)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={14}>
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

      {/* BOTTOM ROW — RAE Progress + Asistencia Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RAEProgressCard progreso={data?.rae_progress} filtroEscuela={filtroEscuela} />
        </div>
        <div>
          <AsistenciaTrendCard trend={data?.asistencia_trend} />
        </div>
      </div>
    </div>
  );
};

const COLOR_PALETTE = ['#6366F1', '#14b8a6', '#EC4899', '#f59e0b', '#ef4444', '#8b5cf6'];

/* ═══════════════════════════════════════════ */
/* StatCard - Versión mejorada con card-paper  */
/* ═══════════════════════════════════════════ */
const StatCard = ({ title, value, icon, color, description, highlight = false, pulse = false }: StatCardProps) => {
  const style = STAT_STYLES[color] || STAT_STYLES.blue;
  return (
    <div
      className={`stat-card group ${highlight ? `border-l-4 ${style.border}` : ''} ${pulse ? 'animate-pulse' : ''}`}
    >
      {/* Fondo degradado sutil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50 pointer-events-none rounded-2xl`} />

      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className={`stat-icon ${style.iconBg}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity text-base-content/30" />
        </div>
        <div className="mt-3">
          <p className="stat-value">{value}</p>
          <p className="stat-label mt-0.5">{title}</p>
          <p className="text-[10px] text-base-content/40 font-medium mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/* RAEProgressCard - Progreso por escuela      */
/* ═══════════════════════════════════════════ */
const RAEProgressCard = ({
  progreso,
  filtroEscuela,
}: {
  progreso: RAEDashboardProgress | undefined;
  filtroEscuela: string;
}) => {
  const escuelas = useMemo(() => {
    if (!progreso?.detalle_escuelas) return [];
    return filtroEscuela
      ? progreso.detalle_escuelas.filter((e) => String(e.escuela_id) === filtroEscuela)
      : progreso.detalle_escuelas;
  }, [progreso, filtroEscuela]);

  if (!progreso) {
    return (
      <div className="card-paper p-6">
        <div className="flex flex-col items-center justify-center h-32 text-base-content/40 italic text-sm">
          <Target size={24} className="mb-2 opacity-30" />
          Cargando progreso RAE...
        </div>
      </div>
    );
  }

  return (
    <div className="card-paper">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Progreso RAE</h3>
              <p className="text-[11px] text-base-content/50 font-medium">Captura por escuela</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-base-content/50">
              {progreso.completadas}/{progreso.total_escuelas} completadas
            </span>
            <div
              className="radial-progress text-primary"
              style={
                { '--value': progreso.porcentaje_general } as React.CSSProperties
              }
              aria-valuenow={progreso.porcentaje_general}
            >
              {progreso.porcentaje_general}%
            </div>
          </div>
        </div>

        {/* Lista de escuelas */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {escuelas.length > 0 ? (
            escuelas.map((esc) => (
              <div key={esc.escuela_id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate">{esc.escuela_nombre}</span>
                    {esc.cerrado && (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-bold tabular-nums shrink-0 ml-2">
                    {esc.completados}/{esc.total_alumnos}
                  </span>
                </div>
                <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(esc.porcentaje, 100)}%`,
                      background: esc.porcentaje >= 100
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : esc.porcentaje >= 50
                          ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                          : 'linear-gradient(90deg, #f59e0b, #f97316)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] font-medium text-base-content/40">
                    {esc.porcentaje}% completado
                  </span>
                  {esc.porcentaje < 100 && !esc.cerrado && (
                    <Link
                      to={`/rae/captura/${esc.registro_id}`}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Capturar
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-base-content/40 italic text-sm">
              <Target size={20} className="mb-1 opacity-30" />
              {filtroEscuela ? 'Sin progreso para esta escuela.' : 'No hay registros RAE activos.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/* AsistenciaTrendCard - Tendencia semanal      */
/* ═══════════════════════════════════════════ */
const AsistenciaTrendCard = ({
  trend,
}: {
  trend: AsistenciaTrendEntry[] | undefined;
}) => {
  const totalPresentes = useMemo(
    () => trend?.reduce((sum, d) => sum + (d.presentes ?? 0), 0) ?? 0,
    [trend],
  );
  const promPorcentaje = useMemo(
    () => trend?.length
      ? Math.round(trend.reduce((sum, d) => sum + (d.porcentaje ?? 0), 0) / trend.length)
      : 0,
    [trend],
  );

  if (!trend || trend.length === 0) {
    return (
      <div className="card-paper p-6">
        <div className="flex flex-col items-center justify-center h-32 text-base-content/40 italic text-sm">
          <TrendingUp size={24} className="mb-2 opacity-30" />
          Sin datos de asistencia.
        </div>
      </div>
    );
  }

  return (
    <div className="card-paper">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 text-green-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Asistencia Semanal</h3>
            <p className="text-[11px] text-base-content/50 font-medium">
              Prom. {promPorcentaje}% · {totalPresentes} registros
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-base-300)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 9, fontWeight: 600 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val + 'T00:00:00');
                  return d.toLocaleDateString('es-MX', { weekday: 'short' });
                }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '2px solid var(--color-base-300)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(_value: number) => [`${_value}%`, 'Asistencia']}
                labelFormatter={(label: string) => {
                  const d = new Date(label + 'T00:00:00');
                  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
                }}
              />
              <Bar
                dataKey="porcentaje"
                radius={[4, 4, 0, 0]}
                barSize={28}
                fill="url(#trendGradient)"
              />
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
