import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './tests/mocks/server';

// Mock de window.matchMedia para Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver para Mantine ScrollArea
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock;

// Iniciar el servidor de MSW antes de todos los tests
beforeAll(() => server.listen());

// Resetear los handlers después de cada test para evitar contaminación
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Cerrar el servidor al finalizar
afterAll(() => server.close());
