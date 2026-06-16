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

export interface GraficaEscuela {
    escuela__nombre: string;
    total: number;
}

export interface ChartEntry {
    clasificacion: string;
    total: number;
}

/** Respuesta del endpoint GET /usuarios/dashboard-data/ */
export interface DashboardData {
    ciclo_actual: string;
    stats: DashboardStats;
    grafica_clasificacion: ChartEntry[];
    grafica_escuelas: GraficaEscuela[];
    ultimos_avisos: Aviso[];
    incidencias_pendientes: number;
    permisos_pendientes: number;
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
