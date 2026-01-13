import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import ListaEscuelas from './pages/escuelas/ListaEscuelas';
import ListaAlumnos from './pages/alumnos/ListaAlumnos';
import ListaDocumentos from './pages/documentos/ListaDocumentos';
import ListaUsuarios from './pages/usuarios/ListaUsuarios';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública (Login) */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas (Con Layout) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/escuelas" element={<ListaEscuelas />} />
          <Route path="/alumnos" element= {<ListaAlumnos/>}/>
          <Route path="/documentos" element={<ListaDocumentos />} />
          <Route path="/usuarios" element={<ListaUsuarios />} />


          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;