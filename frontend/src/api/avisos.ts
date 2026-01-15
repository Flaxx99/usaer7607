import client from './client';
import type { Anuncio } from '../interfaces/aviso';

// --- LEER ---
// El parámetro 'misAvisos' activa el filtro del backend para ver expirados propios
export const getAvisos = async (misAvisos: boolean = false): Promise<Anuncio[]> => {
    const params = misAvisos ? { mis_anuncios: 'true' } : {};
    const response = await client.get('/avisos/', { params });
    if (response.data.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return [];
};

// --- CREAR ---
export const createAviso = async (data: Anuncio): Promise<Anuncio> => {
    const response = await client.post('/avisos/', data);
    return response.data;
};

// --- ACTUALIZAR ---
export const updateAviso = async (data: Anuncio): Promise<Anuncio> => {
    const response = await client.patch(`/avisos/${data.id}/`, data);
    return response.data;
};

// --- ELIMINAR ---
export const deleteAviso = async (id: number): Promise<void> => {
    await client.delete(`/avisos/${id}/`);
};