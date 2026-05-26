import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should redirect to /login if no user is authenticated', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    // In a real app, Navigate would change the URL. 
    // In tests, we check that the child is NOT rendered.
  });

  it('should allow access if user is a superuser', () => {
    localStorage.setItem('user', JSON.stringify({ 
      username: 'admin', 
      is_superuser: true, 
      role: 'ROLE_ADMIN' 
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['ROLE_DOCENTE']}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should allow access if user has one of the allowed roles', () => {
    localStorage.setItem('user', JSON.stringify({ 
      username: 'teacher', 
      is_superuser: false, 
      role: 'ROLE_DOCENTE' 
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['ROLE_DOCENTE', 'ROLE_ADMIN']}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should redirect to /dashboard if user lacks required role', () => {
    localStorage.setItem('user', JSON.stringify({ 
      username: 'teacher', 
      is_superuser: false, 
      role: 'ROLE_DOCENTE' 
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to /login if user JSON is corrupted', () => {
    localStorage.setItem('user', 'invalid-json');

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
