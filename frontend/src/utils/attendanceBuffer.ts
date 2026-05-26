/**
 * attendanceBuffer.ts
 * Utilidad para gestionar la persistencia local de asistencias
 * cuando el servidor no está disponible.
 */

interface PendingAttendance {
  numero_empleado: string;
  timestamp: string;
  id: string;
}

const STORAGE_KEY = 'usaer_pending_attendance';

export const attendanceBuffer = {
  // Guardar una checada fallida en el localStorage
  save: (numero_empleado: string): void => {
    const pending = attendanceBuffer.getAll();
    const newEntry: PendingAttendance = {
      numero_empleado,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pending, newEntry]));
  },

  // Obtener todas las checadas pendientes
  getAll: (): PendingAttendance[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Eliminar una checada específica una vez sincronizada
  remove: (id: string): void => {
    const pending = attendanceBuffer.getAll();
    const filtered = pending.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Limpiar todo el buffer
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Verificar si hay pendientes
  hasPending: (): boolean => {
    return attendanceBuffer.getAll().length > 0;
  }
};
