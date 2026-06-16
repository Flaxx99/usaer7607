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
