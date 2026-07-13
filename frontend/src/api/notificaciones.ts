import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { UnreadCountResponse } from '../interfaces/api';
import type { Notificacion } from '../interfaces/notificacion';

export const getNotificaciones = async (page = 1): Promise<PaginatedResponse<Notificacion>> => {
    const response = await client.get('/notificaciones/', { params: { page } });
    return response.data;
};

export const getUnreadNotificationCount = async (): Promise<UnreadCountResponse> => {
    const response = await client.get('/notificaciones/conteo/');
    return response.data;
};

export const getUnreadNotifications = async (): Promise<PaginatedResponse<Notificacion>> => {
    const response = await client.get('/notificaciones/no_leidas/');
    return response.data;
};

export const markNotificationAsRead = async (id: number) => {
    const response = await client.post(`/notificaciones/${id}/marcar_leida/`);
    return response.data;
};

export const markAllNotificationsAsRead = async () => {
    const response = await client.post('/notificaciones/marcar-todas-leidas/');
    return response.data;
};
