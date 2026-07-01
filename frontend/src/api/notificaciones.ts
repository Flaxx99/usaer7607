import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { UnreadCountResponse } from '../interfaces/api';
import type { Notificacion } from '../interfaces/notificacion';

export const notificacionesApi = {
    getNotificaciones: async (page = 1): Promise<PaginatedResponse<Notificacion>> => {
        const response = await client.get(`/notificaciones/?page=${page}`);
        return response.data;
    },
    getConteo: async (): Promise<UnreadCountResponse> => {
        const response = await client.get('/notificaciones/conteo/');
        return response.data;
    },
    getNoLeidas: async (): Promise<PaginatedResponse<Notificacion>> => {
        const response = await client.get('/notificaciones/no_leidas/');
        return response.data;
    },
    marcarComoLeida: async (id: number) => {
        const response = await client.post(`/notificaciones/${id}/marcar_leida/`);
        return response.data;
    },
    marcarTodasComoLeidas: async () => {
        const response = await client.post('/notificaciones/marcar-todas-leidas/');
        return response.data;
    },
};
