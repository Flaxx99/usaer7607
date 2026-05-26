import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@mantine/core/styles.css'; // Estilos obligatorios de Mantine
import '@mantine/notifications/styles.css'; // Estilos de notificaciones
import '@mantine/dates/styles.css'; // Estilos de selectores de fecha
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { registerSW } from 'virtual:pwa-register';
import { LoadingProvider } from './context/LoadingContext';

// Registrar el service worker para soporte offline y PWA
registerSW({ immediate: true });

// Crear el cliente de React Query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={1000} />
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
)
