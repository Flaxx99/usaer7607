import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RAECaptureGrid from '../pages/rae/RAECaptureGrid';
import { raeApi } from '../api/rae';
import { LoadingProvider } from '../context/LoadingContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock de iconos para evitar errores de resolución en Vitest
vi.mock('@tabler/icons-react', () => ({
    IconSave: () => <div data-testid="icon-save" />,
    IconArrowLeft: () => <div data-testid="icon-arrow-left" />,
    IconCheck: () => <div data-testid="icon-check" />,
    IconAlertCircle: () => <div data-testid="icon-alert" />,
    IconUser: () => <div data-testid="icon-user" />,
    IconFileCheck: () => <div data-testid="icon-file" />,
}));

// Mock de la API
vi.mock('../api/rae', () => ({
    raeApi: {
        initCapture: vi.fn(),
        saveBulk: vi.fn(),
    }
}));

// Mock de notificaciones
vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
    }
}));

// Mock de useParams para simular el ID del registro
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '123' }),
    };
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <LoadingProvider>
            <MemoryRouter initialEntries={['/rae/capture/123']}>
                <Routes>
                    <Route path="/rae/capture/:id" element={children} />
                </Routes>
            </MemoryRouter>
        </LoadingProvider>
    </QueryClientProvider>
);

describe('RAE Persistence & Auto-Save', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should save changes to localStorage when a checkbox is clicked', async () => {
        const mockInitData = {
            escuela: 'Escuela Test',
            ciclo: '2024-2025',
            alumnos: [
                { id: 1, alumno_nombre: 'Juan Perez', ceg: false, bv: false }
            ]
        };
        (raeApi.initCapture as any).mockResolvedValue(mockInitData);

        render(<RAECaptureGrid />, { wrapper });

        // Obtener todos los checkboxes y hacer click en el primero
        const checkboxes = await screen.findAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        // Verificar que se haya guardado en localStorage
        const storageKey = 'rae_drafts_123';
        const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        expect(savedData['1']).toBeDefined();
    });

    it('should recover drafts from localStorage on mount', async () => {
        const storageKey = 'rae_drafts_123';
        const mockDrafts = {
            1: { ceg: true }
        };
        localStorage.setItem(storageKey, JSON.stringify(mockDrafts));

        const mockInitData = {
            escuela: 'Escuela Test',
            ciclo: '2024-2025',
            alumnos: [
                { id: 1, alumno_nombre: 'Juan Perez', ceg: false, bv: false }
            ]
        };
        (raeApi.initCapture as any).mockResolvedValue(mockInitData);

        render(<RAECaptureGrid />, { wrapper });

        // El primer checkbox debe estar marcado ya que cargamos ceg: true desde localStorage
        const checkboxes = await screen.findAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
    });

    it('should clear localStorage after successful bulk save', async () => {
        const storageKey = 'rae_drafts_123';
        // Para que el botón de guardar esté habilitado, debemos inicializar drafts Y dirty rows
        localStorage.setItem(storageKey, JSON.stringify({ 1: { ceg: true } }));
        localStorage.setItem(`${storageKey}_dirty`, JSON.stringify([1]));
        
        const mockInitData = {
            escuela: 'Escuela Test',
            ciclo: '2024-2025',
            alumnos: [{ id: 1, alumno_nombre: 'Juan Perez', ceg: false }]
        };
        (raeApi.initCapture as any).mockResolvedValue(mockInitData);
        (raeApi.saveBulk as any).mockResolvedValue({ status: 'success' });

        render(<RAECaptureGrid />, { wrapper });

        // Esperar a que el botón se habilite y hacer click
        const saveButton = await screen.findByText(/Guardar Cambios/i);
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(localStorage.getItem(storageKey)).toBeNull();
            expect(localStorage.getItem(`${storageKey}_dirty`)).toBeNull();
        });
    });
});
