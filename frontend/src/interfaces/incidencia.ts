export interface Incidencia {
    id: number;
    titulo: string;
    descripcion: string;
    escuela: number;
    escuela_nombre: string;
    profesor: number;      // ID del profesor involucrado
    profesor_nombre: string;
    reportado_por: number;
    reportado_por_nombre: string;
    estado: 'PENDIENTE' | 'RESUELTA';
    respuesta_admin?: string;
    fecha_reporte: string;
    fecha_resolucion?: string;
}

export interface IncidenciaInput {
    titulo: string;
    descripcion: string;
    profesor: number; // ID del profesor involucrado
}

export interface ResolverInput {
    respuesta_admin: string;
}