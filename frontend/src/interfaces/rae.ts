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
