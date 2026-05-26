// src/api/client.ts
import axios from 'axios';
import { notifications } from '@mantine/notifications';

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
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // SESIÓN EXPIRADA
        localStorage.clear();
        notifications.show({
            title: 'Sesión Expirada',
            message: 'Tu sesión ha terminado. Por favor, ingresa nuevamente.',
            color: 'red',
            autoClose: 3000,
        });
        // Forzamos la redirección al login
        window.location.href = '/login';
      }

      if (status === 403) {
        // ACCESO DENEGADO (ROL INSUFICIENTE)
        notifications.show({
            title: 'Acceso Denegado',
            message: 'No tienes los permisos necesarios para realizar esta acción.',
            color: 'orange',
            autoClose: 4000,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default client;