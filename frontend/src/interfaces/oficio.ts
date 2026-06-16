export interface Oficio {
    id: number;
    titulo: string;
    descripcion: string;
    fecha_creacion: string;
    archivo: string;
    escuela: number;
    escuela_nombre: string;
    creado_por: number;
    creado_por_nombre?: string;
}
