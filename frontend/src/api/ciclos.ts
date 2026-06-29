import client from './client';
import type { CicloEscolar, PromocionPreview, PromocionResult } from '../interfaces/ciclo';

// --- LEER ---
export const getCiclos = async (): Promise<CicloEscolar[]> => {
    const response = await client.get('/ciclos/');
    // Manejo robusto de respuesta
    if (response.data.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return [];
};

// --- CREAR ---
export const createCiclo = async (data: CicloEscolar): Promise<CicloEscolar> => {
    const response = await client.post('/ciclos/', data);
    return response.data;
};

// --- ACTUALIZAR ---
export const updateCiclo = async (data: CicloEscolar): Promise<CicloEscolar> => {
    const response = await client.patch(`/ciclos/${data.id}/`, data);
    return response.data;
};

// --- ELIMINAR ---
export const deleteCiclo = async (id: number): Promise<void> => {
    await client.delete(`/ciclos/${id}/`);
};

// --- PROMOCIÓN DE ALUMNOS ---

// 1. Simulación (GET)
export const previewPromocion = async (): Promise<PromocionPreview> => {
    const response = await client.get('/ciclos/promover-alumnos/');
    return response.data;
};

// 2. Ejecución Real (POST)
export const ejecutarPromocion = async (): Promise<PromocionResult> => {
    const response = await client.post('/ciclos/promover-alumnos/', { confirmed: true });
    return response.data;
};
