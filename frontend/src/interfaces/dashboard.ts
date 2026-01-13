// src/interfaces/dashboard.ts

export interface DashboardStats {
    total_alumnos: number;
    total_escuelas: number;
    total_usuarios: number;
}

export interface Aviso {
    id: number;
    titulo: string;
    contenido: string;
    autor: string;
    fecha: string;
}

// Esta es la respuesta completa que manda tu DashboardView
export interface DashboardResponse {
    stats?: DashboardStats; // Es opcional porque solo el ADMIN/DIRECTOR lo ve
    ultimos_avisos: Aviso[];
    permisos_pendientes: number;
    incidencias_pendientes: number;
    // Agrega aquí más campos conforme tu backend crezca
}