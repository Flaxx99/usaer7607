import client from './client';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: 'EVALUACION' | 'REUNION' | 'VISITA' | 'TAREA' | 'OTRO';
    status: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
    priority: 'BAJA' | 'MEDIA' | 'ALTA';
    created_by: number;
    assigned_to: number;
    alumno?: number;
    escuela?: number;
    color: string;
    created_by_nombre?: string;
    assigned_to_nombre?: string;
    alumno_nombre?: string;
    escuela_nombre?: string;
}

export const calendarApi = {
    getEvents: async (page = 1) => {
        const response = await client.get(`/calendario/?page=${page}`);
        return response.data as PaginatedResponse<CalendarEvent>;
    },
    saveEvent: async (data: Partial<CalendarEvent>) => {
        if (data.id) {
            const response = await client.patch(`/calendario/${data.id}/`, data);
            return response.data;
        } else {
            const response = await client.post('/calendario/', data);
            return response.data;
        }
    },
    deleteEvent: async (id: number) => {
        const response = await client.delete(`/calendario/${id}/`);
        return response.data;
    },
};
