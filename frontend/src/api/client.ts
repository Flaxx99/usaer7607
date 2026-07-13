// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Attach access token ─────────────────────────────────────────────
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Refresh queue ───────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Auto-refresh on 401 ────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ── 401 (No autorizado / Token expirado) ──
    if (error.response?.status === 401) {
      // No reintentar si ya lo hicimos, o si es el propio refresh
      if (originalRequest._retry || originalRequest.url?.includes('/auth/token/')) {
        localStorage.clear();
        toast.error('Sesión Expirada', {
          description: 'Tu sesión ha terminado. Por favor, ingresa nuevamente.',
          duration: 3000,
        });
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Si ya hay un refresh en curso, encolar esta request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        });
      }

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/usuarios/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        const { access } = response.data;
        localStorage.setItem('access_token', access);

        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 (Acceso denegado) ──
    if (error.response?.status === 403) {
      toast.warning('Acceso Denegado', {
        description: 'No tienes los permisos necesarios para realizar esta acción.',
        duration: 4000,
      });
    }

    return Promise.reject(error);
  }
);

export default client;