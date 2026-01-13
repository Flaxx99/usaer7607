// src/interfaces/documentos.ts

export interface OtroArchivo {
    id: number;
    archivo: string; // URL
    descripcion: string;
    url_archivo: string | null;
    nombre_archivo: string | null;
}

export interface Expediente {
    id: number;
    alumno: number; // ID
    alumno_nombre?: string; // ReadOnly
    profesor?: number;
    profesor_nombre?: string; // ReadOnly
    
    // Archivos (pueden ser string URL o File al subir)
    informe_deteccion?: string | File | null;
    informe_psicopedagogico?: string | File | null;
    plan_intervencion?: string | File | null;
    
    observaciones: string;
    fecha_subida?: string;
    
    // Extras
    otros_archivos?: OtroArchivo[];
    nuevos_archivos_temp?: { file: File; descripcion: string }[];
}