import client from './client';
import type { Incidencia, IncidenciaInput, ResolverInput } from '../interfaces/incidencia';

// Listar Incidencias (CORREGIDO)
export const getIncidencias = async (): Promise<Incidencia[]> => {
    const response = await client.get('/incidencias/');
    
    // Si viene paginado (con 'results'), devolvemos eso. Si no, devolvemos data directo.
    if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
};

// Crear Incidencia
export const createIncidencia = async (data: IncidenciaInput): Promise<Incidencia> => {
    const response = await client.post('/incidencias/', data);
    return response.data;
};

// Resolver Incidencia (Solo Directores/Admins)
export const resolverIncidencia = async (id: number, data: ResolverInput): Promise<Incidencia> => {
    const response = await client.post(`/incidencias/${id}/resolver/`, data);
    return response.data;
};

// Helper: Obtener lista de maestros para el dropdown
export const getMaestrosParaSelect = async () => {
    const response = await client.get('/usuarios/', { params: { role: 'MAESTRO_APOYO', activo: true } });
    // Misma corrección para usuarios por si acaso
    return response.data.results || response.data; 
};