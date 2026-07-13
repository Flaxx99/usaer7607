import client from './client';
import type { Alumno } from '../interfaces/alumno';
import type { PaginatedResponse } from '../interfaces/common';

// Obtener lista paginada y filtrada
export const getAlumnos = async (page = 1, search = '', escuela = '', condicion = '', estado = 'ACTIVOS'): Promise<PaginatedResponse<Alumno>> => {
    const response = await client.get('/alumnos/', {
        params: {
            page,
            ...(search && { search }),
            ...(escuela && escuela !== 'TODAS' && { escuela }),
            ...(condicion && condicion !== 'TODAS' && { condicion }),
            ...(estado && { estado }),
        },
    });
    
    // Si viene la respuesta estructurada de DRF, la retornamos tal cual.
    if (response.data && response.data.results) {
        return response.data;
    }
    
    // Caso alternativo si no está paginado (para evitar que se rompa)
    return {
        count: Array.isArray(response.data) ? response.data.length : 0,
        next: null,
        previous: null,
        results: Array.isArray(response.data) ? response.data : []
    };
};

// Crear (Django asigna el profesor automáticamente si eres Maestro)
export const createAlumno = async (data: Alumno): Promise<Alumno> => {
    const response = await client.post('/alumnos/', data);
    return response.data;
};

// Actualizar
export const updateAlumno = async (data: Alumno): Promise<Alumno> => {
    const response = await client.put(`/alumnos/${data.id}/`, data);
    return response.data;
};

// Eliminar (Tu backend protege el borrado si hay datos asociados)
export const deleteAlumno = async (id: number): Promise<void> => {
    await client.delete(`/alumnos/${id}/`);
};
