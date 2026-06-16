import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { Notificacion } from '../interfaces/notificacion';

export const notificacionesApi = {
    getNotificaciones: async (page = 1): Promise<PaginatedResponse<Notificacion>> => {
        const response = await client.get(`/notificaciones/?page=${page}`);
        return response.data;
    },
    marcarComoLeida: async (id: number) => {
        const response = await client.patch(`/notificaciones/${id}/`, { leida: true });
        return response.data;
    },
    marcarTodasComoLeidas: async () => {
        const response = await client.post('/notificaciones/marcar-todas-leidas/');
        return response.data;
    },
};
