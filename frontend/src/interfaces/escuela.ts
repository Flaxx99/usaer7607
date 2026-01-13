// src/interfaces/escuela.ts

export interface Escuela {
    id: number;
    clave_estatal: string;
    cct: string; 
    nombre: string;
    nivel: 'Primaria' | 'Preescolar' | 'Secundaria' | 'PRIMARIA' | 'PREESCOLAR' | 'SECUNDARIA' | string;
    zona: string;
    domicilio: string; 
    colonia: string;   
    telefono?: string;
    
}