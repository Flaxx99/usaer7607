import client from './client';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface RegistroRAC {
    id: number;
    alumno: number;
    ciclo_escolar: number;
    escuela_regular: number;
    zona_regular: string;
    curp: string;
    sexo: string;
    edad: number;
    grado: string;
    service_type: string;
    sup_especial_cct: string;
    sup_especial_zona: string;
    centro_cct: string;
    centro_nombre: string;
    maestro_apoyo: number;
    escuela_basica: number;
    clasificacion: string;
    subclasificacion: string;
    observaciones: string;
    fecha_registro: string;
    alumno_nombre?: string;
    escuela_nombre?: string;
    maestro_nombre?: string;
    service_type_display?: string;
}

export const racApi = {
    getRecords: async (page = 1) => {
        const response = await client.get(`/api/rac/?page=${page}`);
        return response.data as PaginatedResponse<RegistroRAC>;
    },
    saveRecord: async (data: Partial<RegistroRAC>) => {
        if (data.id) {
            const response = await client.patch(`/api/rac/${data.id}/`, data);
            return response.data;
        } else {
            const response = await client.post('/api/rac/', data);
            return response.data;
        }
    },
    exportMyRecords: async () => {
        const response = await client.get('/api/rac/exportar/', {
            responseType: 'blob',
        });
        return response.data;
    },
    exportGlobal: async () => {
        const response = await client.get('/api/rac/exportar-todo/', {
            responseType: 'blob',
        });
        return response.data;
    },
};
