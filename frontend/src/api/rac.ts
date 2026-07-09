import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { RegistroRAC } from '../interfaces/rac';

export const getRACRecords = async (page = 1): Promise<PaginatedResponse<RegistroRAC>> => {
    const response = await client.get(`/rac/?page=${page}`);
    return response.data;
};

export const getRACByAlumno = async (alumnoId: number): Promise<RegistroRAC[]> => {
    const response = await client.get(`/rac/por_alumno/?alumno_id=${alumnoId}`);
    return response.data;
};

export const saveRACRecord = async (data: Partial<RegistroRAC>) => {
    if (data.id) {
        const response = await client.patch(`/rac/${data.id}/`, data);
        return response.data;
    } else {
        const response = await client.post('/rac/', data);
        return response.data;
    }
};

export const exportMyRACRecords = async () => {
    const response = await client.get('/rac/exportar/', {
        responseType: 'blob',
    });
    return response.data;
};

export const exportGlobalRAC = async () => {
    const response = await client.get('/rac/exportar-todo/', {
        responseType: 'blob',
    });
    return response.data;
};
