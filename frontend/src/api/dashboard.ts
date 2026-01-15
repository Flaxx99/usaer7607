import client from './client';

export interface DashboardData {
    ciclo_actual: string;
    stats: {
        total_alumnos: number;
        total_maestros: number;
        total_escuelas: number;
        total_usuarios: number;
    };
    grafica_clasificacion: { clasificacion: string; total: number }[];
    grafica_escuelas: { escuela__nombre: string; total: number }[];
    
    // --- AGREGADO: Array de avisos ---
    ultimos_avisos: {
        id: number;
        titulo: string;
        contenido: string;
        fecha: string;
        autor: string;
    }[];
    
    incidencias_pendientes: number;
    permisos_pendientes: number;
}

export const getDashboardData = async (): Promise<DashboardData> => {
    const response = await client.get('/usuarios/dashboard-data/');
    return response.data;
};