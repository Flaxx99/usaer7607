import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { RAEProgressItem, RegistroRAE, RAEAlumno, RAEInitResponse } from '../interfaces/rae';

export const getRAEMyRecords = async (page = 1, search = ''): Promise<PaginatedResponse<RegistroRAE>> => {
    const response = await client.get('/rae/mis_registros/', {
        params: { page, ...(search && { search }) },
    });
    return response.data;
};

export const initRAECapture = async (): Promise<RAEInitResponse> => {
    const response = await client.get('/rae/captura/');
    return response.data;
};

export const saveRAEBulk = async (data: { registro_id: number; version: number; alumnos: RAEAlumno[] }) => {
    const response = await client.post('/rae/guardar_bulk/', data);
    return response.data;
};

export const exportRAEExcel = async (id: number) => {
    const response = await client.get(`/rae/exportar_excel/${id}`, {
        responseType: 'blob',
    });
    return response.data;
};

export const exportAllRAE = async () => {
    const response = await client.get('/rae/exportar_todo_excel/', {
        responseType: 'blob',
    });
    return response.data;
};

export const getRAEProgress = async (): Promise<RAEProgressItem[]> => {
    const response = await client.get('/rae/progreso/');
    return response.data;
};

export const closeRAERegistro = async (id: number, cerrado: boolean) => {
    const response = await client.post(`/rae/cerrar/${id}/`, { cerrado });
    return response.data;
};
