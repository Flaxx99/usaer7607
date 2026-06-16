import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { Oficio } from '../interfaces/oficio';

export const getOficios = async (page = 1): Promise<PaginatedResponse<Oficio>> => {
    const response = await client.get(`/api/oficios/?page=${page}`);
    return response.data;
};

export const uploadOficio = async (formData: FormData) => {
    const response = await client.post('/api/oficios/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteOficio = async (id: number) => {
    const response = await client.delete(`/api/oficios/${id}/`);
    return response.data;
};
