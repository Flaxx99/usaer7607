// src/api/client.ts
import axios from 'axios';

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
      // --- AQUÍ ESTABA EL ERROR ---
      // ANTES: config.headers.Authorization = `Bearer ${token}`;
      
      // AHORA: Usamos 'Token' porque es lo que usa Django Rest Framework por defecto
      config.headers.Authorization = `Token ${token}`; 
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o token inválido');
      // Opcional: Redirigir a login si el token muere
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;