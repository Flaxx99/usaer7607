// src/interfaces/dashboard.ts

export interface DashboardStats {
    total_alumnos: number;
    total_escuelas: number;
    total_usuarios: number;
    total_maestros: number;
}

export interface Aviso {
    id: number;
    titulo: string;
    contenido: string;
    autor: string;
    fecha: string;
}

export interface ChartEntry {
    clasificacion: string;
    total: number;
}

// Esta es la respuesta completa que manda tu DashboardView
export interface DashboardResponse {
    stats?: DashboardStats; // Es opcional porque solo el ADMIN/DIRECTOR lo ve
    ultimos_avisos: Aviso[];
    permisos_pendientes: number;
    incidencias_pendientes: number;
    ciclo_actual?: string;
    grafica_clasificacion?: ChartEntry[];
}

export interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    description: string;
    highlight?: boolean;
    pulse?: boolean;
}