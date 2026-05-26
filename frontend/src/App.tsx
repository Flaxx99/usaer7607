import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages imports
import ListaEscuelas from './pages/escuelas/ListaEscuelas';
import ListaAlumnos from './pages/alumnos/ListaAlumnos';
import ListaDocumentos from './pages/documentos/ListaDocumentos';
import ListaUsuarios from './pages/usuarios/ListaUsuarios';
import ListaCiclos from './pages/ciclos/ListaCiclos';
import TablonAvisos from './pages/avisos/TablaAvisos';
import GestionPermisos from './pages/permisos/GestionPermisos';
import Kiosco from './pages/asistencia/Kiosco';
import HistorialAsistencia from './pages/asistencia/HistorialAsistencia';
import GestionIncidencias from './pages/incidencias/GestionIncidencias';
import OficiosList from './pages/oficios/OficiosList';
import RACList from './pages/rac/RACList';
import RACForm from './pages/rac/RACForm';
import RAERecordsList from './pages/rae/RAERecordsList';
import RAECaptureGrid from './pages/rae/RAECaptureGrid';
import RAEValidationPanel from './pages/rae/RAEValidationPanel';
import SchoolCalendar from './pages/calendar/SchoolCalendar';

// Definición de Roles para Seguridad de Rutas
const ROLE_ADMIN = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO'];
const ROLE_DOCENTE = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIO', 'MAESTRO_APOYO'];

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
            </Route>

            {/* Rutas restringidas a Docentes y Admins */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_DOCENTE} />}>
               <Route path="/alumnos" element= {<ListaAlumnos/>}/>
               <Route path="/documentos" element={<ListaDocumentos />} />
               <Route path="/rac" element={<RACList />} />
               <Route path="/rac/nuevo" element={<RACForm />} />
               <Route path="/rac/editar/:id" element={<RACForm />} />
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;