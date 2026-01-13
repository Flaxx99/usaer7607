import client from './client';
import type { Alumno } from '../interfaces/alumno';

// Obtener lista
export const getAlumnos = async (): Promise<Alumno[]> => {
    const response = await client.get('/alumnos/');
    
    // --- CORRECCIÓN AQUÍ ---
    // Django devuelve { count: 50, results: [...] } por la paginación.
    // Verificamos si existe 'results' y devolvemos eso.
    if (response.data.results) {
        return response.data.results;
    }
    
    // Si algún día quitas la paginación, devolverá el array directo.
    return response.data;
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