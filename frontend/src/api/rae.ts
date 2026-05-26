import client from './client';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface RAEAlumno {
    id: number;
    registro: number;
    alumno: number;
    capturado_por: number;
    curp: string;
    genero: string;
    edad: number;
    grado: string;
    ceg: boolean;
    bv: boolean;
    so: boolean;
    hp: boolean;
    scg: boolean;
    dmo: boolean;
    di: boolean;
    dme: boolean;
    psicosocial: boolean;
    dm: boolean;
    dsc: boolean;
    dsco: boolean;
    dsa: boolean;
    tda: boolean;
    tea: boolean;
    asi: boolean;
    asc: boolean;
    asa: boolean;
    asp: boolean;
    ass: boolean;
    ot: boolean;
    psicologia: boolean;
    comunicacion: boolean;
    psicomotricidad: boolean;
    trabajo_social: boolean;
    aprendizaje: boolean;
    nuevo_ingreso: boolean;
    subsecuente: boolean;
    diagnostico: boolean;
    educativo: boolean;
    deteccion: boolean;
    psicopedagogico: boolean;
    plan: boolean;
    modelo: boolean;
    alumno_nombre?: string;
}

export interface RegistroRAE {
    id: number;
    escuela: number;
    ciclo_escolar: number;
    creado_por: number;
    fecha_creacion: string;
    docente_hombres: number;
    docente_mujeres: number;
    escuela_nombre?: string;
    ciclo_nombre?: string;
}

export interface RAEInitResponse {
    registro_id: number;
    ciclo: string;
    escuela: string;
    alumnos: RAEAlumno[];
}

export const raeApi = {
    getMyRecords: async (page = 1) => {
        const response = await client.get(`/rae/mis_registros/?page=${page}`);
        return response.data as PaginatedResponse<RegistroRAE>;
    },
    initCapture: async () => {
        const response = await client.get('/rae/captura/');
        return response.data as RAEInitResponse;
    },
    saveBulk: async (data: { registro_id: number, alumnos: any[] }) => {
        const response = await client.post('/rae/guardar_bulk/', data);
        return response.data;
    },
    exportExcel: async (id: number) => {
        const response = await client.get(`/rae/exportar_excel/${id}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
