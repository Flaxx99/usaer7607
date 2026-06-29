// Re-exportado desde api.ts (generado de pydantic AsistenciaResponse).
// Ambos campos hora son string | undefined (nullable desde backend).
export type { AsistenciaResponse as Asistencia } from './api';

export interface RespuestaChecador {
    message: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'ERROR';
    profesor: string;
    hora: string;
    detalle?: string; // Para horas trabajadas o errores
}