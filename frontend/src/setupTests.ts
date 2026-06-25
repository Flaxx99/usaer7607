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

// Suprimir warnings de recharts en jsdom (no afectan los tests)
const originalWarn = console.warn.bind(console);
console.warn = (msg, ...args) => {
  if (typeof msg === 'string' && msg.includes('width(0) and height(0) of chart')) return;
  originalWarn(msg, ...args);
};

// Iniciar el servidor de MSW antes de todos los tests
beforeAll(() => server.listen());

// Resetear los handlers después de cada test para evitar contaminación
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Cerrar el servidor al finalizar
afterAll(() => server.close());
