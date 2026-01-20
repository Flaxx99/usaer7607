import client from './client';
import type { Asistencia, RespuestaChecador } from '../interfaces/asistencia';

// --- KIOSCO (Público) ---
export const registrarAsistencia = async (numero_empleado: string): Promise<RespuestaChecador> => {
    const response = await client.post('/asistencias/checar/', { numero_empleado });
    return response.data;
};

// --- HISTORIAL (Privado) ---
export const getHistorialAsistencia = async (filtros: { fecha?: string } = {}): Promise<Asistencia[]> => {
    const response = await client.get('/asistencias/', { params: filtros });
    
    // CORRECCIÓN: Detectar si hay paginación (results) o si es lista plana
    if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    
    if (Array.isArray(response.data)) {
        return response.data;
    }
    
    // Si no es array ni tiene results, devolvemos array vacío para evitar errores
    return [];
};