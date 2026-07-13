import client from './client';
import type { PaginatedResponse } from '../interfaces/common';
import type { CalendarEvent } from '../interfaces/calendar';

export const getCalendarEvents = async (page = 1) => {
    const response = await client.get('/calendario/', { params: { page } });
    return response.data as PaginatedResponse<CalendarEvent>;
};

export const saveCalendarEvent = async (data: Partial<CalendarEvent>) => {
    if (data.id) {
        const response = await client.patch(`/calendario/${data.id}/`, data);
        return response.data;
    } else {
        const response = await client.post('/calendario/', data);
        return response.data;
    }
};

export const deleteCalendarEvent = async (id: number) => {
    const response = await client.delete(`/calendario/${id}/`);
    return response.data;
};
