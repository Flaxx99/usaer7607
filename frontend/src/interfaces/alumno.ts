// IMPORTANTE: Usa "import type"
import type { Escuela } from "./escuela";

export type Sexo = 'H' | 'M';

export type Clasificacion = 
    | 'DISCAPACIDAD' 
    | 'DIFICULTADES_SEVERAS' 
    | 'TRASTORNOS' 
    | 'APTITUDES_SOBRESALIENTES' 
    | 'NINGUNO' 
    | 'OTRO';

export interface Alumno {
    id: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    curp: string;
    fecha_nacimiento: string | null;
    sexo: Sexo;
    edad?: number;
    
    grado: string;
    grupo: string;

    // Relaciones
    escuela: number; // El ID que enviamos al backend
    profesor?: number | null; 

    // Aquí usamos la interfaz Escuela que importamos arriba
    escuela_detalle?: Escuela; 
    
    activo: boolean;
    clasificacion: Clasificacion;
    clasificacion_otro?: string;
}