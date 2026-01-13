// src/api/dashboard.ts
import client from './client';

// CORRECCIÓN: Agregamos la palabra 'type' aquí
import type { DashboardResponse } from '../interfaces/dashboard';

export const getDashboardData = async (): Promise<DashboardResponse> => {
    const response = await client.get('/usuarios/dashboard-data/');
    return response.data;
};