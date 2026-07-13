import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { Oficio } from '../interfaces/oficio';

export const getOficios = async (page = 1, search = ''): Promise<PaginatedResponse<Oficio>> => {
    const response = await client.get('/oficios/', {
        params: { page, ...(search && { search }) },
    });
    return response.data;
};

export const uploadOficio = async (formData: FormData) => {
    const response = await client.post('/oficios/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateOficio = async (id: number, formData: FormData) => {
    const response = await client.patch(`/oficios/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteOficio = async (id: number) => {
    const response = await client.delete(`/oficios/${id}/`);
    return response.data;
};
