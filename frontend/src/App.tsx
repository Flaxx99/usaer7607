import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- RUTA PRINCIPAL (PÚBLICA): EL KIOSCO --- */}
        <Route path="/" element={<Kiosco />} />

        {/* --- RUTA LOGIN (ADMINISTRATIVOS) --- */}
        <Route path="/login" element={<Login />} />
        
        {/* --- RUTAS PROTEGIDAS (SISTEMA) --- */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/escuelas" element={<ListaEscuelas />} />
          <Route path="/alumnos" element= {<ListaAlumnos/>}/>
          <Route path="/documentos" element={<ListaDocumentos />} />
          <Route path="/usuarios" element={<ListaUsuarios />} />
          <Route path="/ciclos" element={<ListaCiclos />} />
          <Route path="/avisos" element={<TablonAvisos />} />
          <Route path="/permisos" element={<GestionPermisos />} />
          <Route path="/asistencias" element={<HistorialAsistencia />} />
          <Route path="/incidencias" element={<GestionIncidencias />} />
        </Route>

        {/* --- CATCH-ALL: Cualquier ruta desconocida manda al Kiosco --- */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;