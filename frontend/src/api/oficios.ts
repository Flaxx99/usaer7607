import client from './client';

export interface Oficio {
    id: number;
    titulo: string;
    descripcion?: string;
    archivo: string;
    fecha_subida: string;
    subido_por: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const getOficios = async (page = 1, search = ''): Promise<PaginatedResponse<Oficio>> => {
    let url = `/oficios/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await client.get(url);
    return response.data;
};

export const uploadOficio = async (formData: FormData): Promise<Oficio> => {
    const response = await client.post('/oficios/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteOficio = async (id: number): Promise<void> => {
    await client.delete(`/oficios/${id}/`);
};
