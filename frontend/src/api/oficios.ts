import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { Oficio } from '../interfaces/oficio';

export const getOficios = async (page = 1, search = ''): Promise<PaginatedResponse<Oficio>> => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.append('search', search);
    const response = await client.get(`/api/oficios/?${params}`);
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
