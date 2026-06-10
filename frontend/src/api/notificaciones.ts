import client from './client';

export interface Notificacion {
    id: number;
    titulo: string;
    contenido: string;
    leido: boolean;
    fecha_creacion: string;
    usuario_nombre?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const notificacionesApi = {
    getNotificaciones: async (page = 1): Promise<PaginatedResponse<Notificacion>> => {
        const response = await client.get(`/notificaciones/?page=${page}`);
        return response.data;
    },
    marcarComoLeida: async (id: number): Promise<void> => {
        await client.patch(`/notificaciones/${id}/marcar_leida/`);
    },
    marcarTodasComoLeidas: async (): Promise<void> => {
        await client.post('/notificaciones/marcar_todas_leidas/');
    }
};
