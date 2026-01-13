// src/api/escuelas.ts
import client from './client';
import type { Escuela } from '../interfaces/escuela';

// Obtener todas las escuelas
export const getEscuelas = async (): Promise<Escuela[]> => {
    // CORRECCIÓN 1: La URL es solo '/escuelas/' (el cliente ya agrega '/api')
    const response = await client.get('/escuelas/');
    
    // CORRECCIÓN 2: Manejo de paginación de Django
    // Si Django devuelve { count: 10, results: [...] }, tomamos results.
    if (response.data.results) {
        return response.data.results;
    }
    
    return response.data;
};

// Borrar una escuela
export const deleteEscuela = async (id: number): Promise<void> => {
    await client.delete(`/escuelas/${id}/`);
};

// Crear escuela
export const createEscuela = async (data: Partial<Escuela>): Promise<Escuela> => {
    const response = await client.post('/escuelas/', data);
    return response.data;
};

export const updateEscuela = async (data: Escuela): Promise<Escuela> => {
    // Django espera PUT en /api/escuelas/{id}/
    const response = await client.put(`/escuelas/${data.id}/`, data);
    return response.data;
};