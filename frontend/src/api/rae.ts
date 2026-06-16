import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { RegistroRAE, RAEAlumno, RAEInitResponse } from '../interfaces/rae';

export const raeApi = {
    getMyRecords: async (page = 1): Promise<PaginatedResponse<RegistroRAE>> => {
        const response = await client.get(`/api/rae/mis_registros/?page=${page}`);
        return response.data;
    },
    initCapture: async (): Promise<RAEInitResponse> => {
        const response = await client.get('/api/rae/captura/');
        return response.data;
    },
    saveBulk: async (data: { registro_id: number; alumnos: RAEAlumno[] }) => {
        const response = await client.post('/api/rae/guardar_bulk/', data);
        return response.data;
    },
    exportExcel: async (id: number) => {
        const response = await client.get(`/api/rae/exportar_excel/${id}`, {
            responseType: 'blob',
        });
        return response.data;
    },
    exportAll: async () => {
        const response = await client.get('/api/rae/exportar_todo_excel/', {
            responseType: 'blob',
        });
        return response.data;
    },
};
