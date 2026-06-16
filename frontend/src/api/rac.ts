import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { RegistroRAC } from '../interfaces/rac';

export const racApi = {
    getRecords: async (page = 1): Promise<PaginatedResponse<RegistroRAC>> => {
        const response = await client.get(`/api/rac/?page=${page}`);
        return response.data;
    },
    saveRecord: async (data: Partial<RegistroRAC>) => {
        if (data.id) {
            const response = await client.patch(`/api/rac/${data.id}/`, data);
            return response.data;
        } else {
            const response = await client.post('/api/rac/', data);
            return response.data;
        }
    },
    exportMyRecords: async () => {
        const response = await client.get('/api/rac/exportar/', {
            responseType: 'blob',
        });
        return response.data;
    },
    exportGlobal: async () => {
        const response = await client.get('/api/rac/exportar-todo/', {
            responseType: 'blob',
        });
        return response.data;
    },
};
