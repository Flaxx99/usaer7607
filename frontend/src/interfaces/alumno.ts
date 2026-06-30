// src/interfaces/alumno.ts
//
// Re-exportado desde api.ts (generado de pydantic AlumnoResponse).
//
// Sexo y Clasificacion se mantienen manuales para union types precisos;
// el AlumnoResponse usa strings genéricos para esos campos.

export type { AlumnoResponse as Alumno } from './api';

export type Sexo = 'H' | 'M';

export type Clasificacion = 
    | 'DISCAPACIDAD' 
    | 'DIFICULTADES_SEVERAS' 
    | 'TRASTORNOS' 
    | 'APTITUDES_SOBRESALIENTES' 
    | 'NINGUNO' 
    | 'OTRO';
