import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ThemeProvider'
import { registerSW } from 'virtual:pwa-register';

// Registrar el service worker para soporte offline y PWA
registerSW({ immediate: true });

// Crear el cliente de React Query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
