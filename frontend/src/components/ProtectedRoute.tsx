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
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role || '';
  const isSuperUser = user.is_superuser || false;

  if (isSuperUser) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
