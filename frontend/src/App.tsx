import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingProvider } from './context/LoadingContext';

// --- Lazy-loaded page chunks ---
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ListaEscuelas = lazy(() => import('./pages/escuelas/ListaEscuelas'));
const ListaAlumnos = lazy(() => import('./pages/alumnos/ListaAlumnos'));
const ListaDocumentos = lazy(() => import('./pages/documentos/ListaDocumentos'));
const ListaUsuarios = lazy(() => import('./pages/usuarios/ListaUsuarios'));
const ListaCiclos = lazy(() => import('./pages/ciclos/ListaCiclos'));
const TablonAvisos = lazy(() => import('./pages/avisos/TablaAvisos'));
const GestionPermisos = lazy(() => import('./pages/permisos/GestionPermisos'));
const Kiosco = lazy(() => import('./pages/asistencia/Kiosco'));
const HistorialAsistencia = lazy(() => import('./pages/asistencia/HistorialAsistencia'));
const GestionIncidencias = lazy(() => import('./pages/incidencias/GestionIncidencias'));
const OficiosList = lazy(() => import('./pages/oficios/OficiosList'));
const RACList = lazy(() => import('./pages/rac/RACList'));
const RACForm = lazy(() => import('./pages/rac/RACForm'));
const RACStudentTimeline = lazy(() => import('./pages/rac/RACStudentTimeline'));
const RAERecordsList = lazy(() => import('./pages/rae/RAERecordsList'));
const RAECaptureGrid = lazy(() => import('./pages/rae/RAECaptureGrid'));
const RAEValidationPanel = lazy(() => import('./pages/rae/RAEValidationPanel'));
const SchoolCalendar = lazy(() => import('./pages/calendar/SchoolCalendar'));
const ListaNotificaciones = lazy(() => import('./pages/notificaciones/ListaNotificaciones'));

// Definición de Roles para Seguridad de Rutas
const ROLE_ADMIN = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO'];
const ROLE_DOCENTE = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO', 'MAESTRO_APOYO'];

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200">
    <div className="flex flex-col items-center gap-3">
      <div className="loading loading-spinner loading-lg text-primary" />
      <p className="text-sm font-bold text-base-content/50">Cargando...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LoadingProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
          
          {/* --- RUTA PRINCIPAL (PÚBLICA): EL KIOSCO --- */}
          <Route path="/" element={<Kiosco />} />

          {/* --- RUTA LOGIN (ADMINISTRATIVOS) --- */}
          <Route path="/login" element={<Login />} />
          
          {/* --- RUTAS PROTEGIDAS (SISTEMA) --- */}
          <Route element={<MainLayout />}>
            {/* Rutas accesibles para cualquier usuario autenticado */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/avisos" element={<TablonAvisos />} />
              <Route path="/asistencias" element={<HistorialAsistencia />} />
             <Route path="/permisos" element={<GestionPermisos />} />
             <Route path="/incidencias" element={<GestionIncidencias />} />
             <Route path="/notificaciones" element={<ListaNotificaciones />} />
           </Route>

            {/* Rutas restringidas a Docentes y Admins */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_DOCENTE} />}>
               <Route path="/alumnos" element= {<ListaAlumnos/>}/>
               <Route path="/documentos" element={<ListaDocumentos />} />
               <Route path="/rac" element={<RACList />} />
                <Route path="/rac/nuevo" element={<RACForm />} />
                <Route path="/rac/editar/:id" element={<RACForm />} />
                <Route path="/rac/alumno/:alumnoId" element={<RACStudentTimeline />} />
               <Route path="/rae" element={<RAERecordsList />} />
               <Route path="/rae/capture/:id" element={<RAECaptureGrid />} />
               <Route path="/rae/validate/:id" element={<RAEValidationPanel />} />
               <Route path="/agenda" element={<SchoolCalendar />} />
            </Route>


            {/* Rutas restringidas solo a Administradores */}
             <Route element={<ProtectedRoute allowedRoles={ROLE_ADMIN} />}>
               <Route path="/escuelas" element={<ListaEscuelas />} />
               <Route path="/usuarios" element={<ListaUsuarios />} />
               <Route path="/oficios" element={<OficiosList />} />
               <Route path="/ciclos" element={<ListaCiclos />} />
             </Route>

          </Route>

          {/* --- CATCH-ALL --- */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
        </Suspense>
        </LoadingProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;