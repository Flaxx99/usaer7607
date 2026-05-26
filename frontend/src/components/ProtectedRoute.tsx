import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

/**
 * ProtectedRoute
 * Componente de seguridad que valida:
 * 1. Si el usuario está autenticado.
 * 2. Si el usuario tiene el rol necesario para acceder a la ruta.
 */
export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    // No hay usuario logueado -> Login
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const userRole = user.role || '';
    const isSuperUser = user.is_superuser || false;

    // Los Superusuarios tienen acceso a TODO
    if (isSuperUser) {
      return children ? <>{children}</> : <Outlet />;
    }

    // Si se definieron roles permitidos, validamos si el usuario tiene uno de ellos
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Usuario logueado pero sin permisos -> Dashboard (o página de No Autorizado)
      return <Navigate to="/dashboard" replace />;
    }

    // Todo correcto -> Permitir acceso
    return children ? <>{children}</> : <Outlet />;
  } catch (e) {
    // Error en el JSON del usuario -> Login
    return <Navigate to="/login" replace />;
  }
};
