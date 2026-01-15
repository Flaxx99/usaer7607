import client from './client';
import type { Permiso, MetricasPermisos, EstadoPermiso } from '../interfaces/permisos';

// --- LEER ---
export const getPermisos = async (filters: Record<string, any> = {}): Promise<Permiso[]> => {
    // Convertimos filtros a query params
    const response = await client.get('/permisos/', { params: filters });
    if (response.data.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return [];
};

export const getMetricasPermisos = async (): Promise<MetricasPermisos> => {
    const response = await client.get('/permisos/metricas/');
    return response.data;
};

// --- CREAR ---
export const createPermiso = async (data: Partial<Permiso>): Promise<Permiso> => {
    const response = await client.post('/permisos/', data);
    return response.data;
};

// --- RESPONDER (APROBAR/RECHAZAR) ---
export const responderPermiso = async (id: number, estado: EstadoPermiso, respuesta: string): Promise<Permiso> => {
    const response = await client.post(`/permisos/${id}/responder/`, {
        estado,
        respuesta_admin: respuesta
    });
    return response.data;
};

// --- ELIMINAR (Solo si está pendiente) ---
export const deletePermiso = async (id: number): Promise<void> => {
    await client.delete(`/permisos/${id}/`);
};