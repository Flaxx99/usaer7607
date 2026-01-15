export interface Anuncio {
    id: number;
    titulo: string;
    contenido: string;
    fecha_publicacion: string; // ISO String datetime
    fecha_expiracion?: string | null;
    autor: number;
    autor_nombre: string; // ReadOnlyField del backend
    es_activo: boolean;   // ReadOnlyField del backend
}