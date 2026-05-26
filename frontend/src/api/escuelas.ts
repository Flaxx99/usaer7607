// src/api/escuelas.ts
import client from './client';
import type { Escuela } from '../interfaces/escuela';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Obtener todas las escuelas (soporta opcionalmente paginado o lote grande para select)
export const getEscuelas = async (page_size = 1000, page = 1): Promise<Escuela[]> => {
    const response = await client.get(`/escuelas/?page_size=${page_size}&page=${page}`);
    
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
    const response = await client.put(`/escuelas/${data.id}/`, data);
    return response.data;
};
