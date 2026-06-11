// src/api/client.ts
import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`; 
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // SESIÓN EXPIRADA
        localStorage.clear();
        toast.error('Sesión Expirada', {
          description: 'Tu sesión ha terminado. Por favor, ingresa nuevamente.',
          duration: 3000,
        });
        // Forzamos la redirección al login
        window.location.href = '/login';
      }

      if (status === 403) {
        // ACCESO DENEGADO (ROL INSUFICIENTE)
        toast.warning('Acceso Denegado', {
          description: 'No tienes los permisos necesarios para realizar esta acción.',
          duration: 4000,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default client;