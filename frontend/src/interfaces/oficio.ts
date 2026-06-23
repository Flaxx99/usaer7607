export interface Oficio {
    id: number;
    titulo: string;
    descripcion: string;
    archivo: string;
    fecha_subida: string;
    subido_por: number;
    subido_por_nombre?: string;
}
