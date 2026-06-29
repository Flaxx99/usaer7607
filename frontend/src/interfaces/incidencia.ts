// Re-exportado desde api.ts (generado de pydantic IncidenciaResponse).
export type { IncidenciaResponse as Incidencia } from './api';

export interface IncidenciaInput {
    titulo: string;
    descripcion: string;
    profesor: number; // ID del profesor involucrado
}

export interface ResolverInput {
    respuesta_admin: string;
}