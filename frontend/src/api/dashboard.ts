import client from './client';
import type { DashboardData } from '../interfaces/dashboard';

export const getDashboardData = async (): Promise<DashboardData> => {
    const response = await client.get('/usuarios/dashboard-data/');
    return response.data;
};
