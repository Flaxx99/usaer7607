// src/interfaces/alumno.ts
//
// Tipos para Alumnos. Combina la respuesta de la API con tipos estrictos para el frontend.

import type { AlumnoResponse } from './api';

export type Sexo = 'H' | 'M';

export type Clasificacion = 
    | 'DISCAPACIDAD' 
    | 'DIFICULTADES_SEVERAS' 
    | 'TRASTORNOS' 
    | 'APTITUDES_SOBRESALIENTES' 
    | 'NINGUNO' 
    | 'OTRO';

export type Alumno = AlumnoResponse & {
    sexo: Sexo;
    clasificacion: Clasificacion;
};
