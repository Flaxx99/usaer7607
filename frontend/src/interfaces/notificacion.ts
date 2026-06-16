export interface Notificacion {
    id: number;
    titulo: string;
    contenido: string;
    leido: boolean;
    fecha_creacion: string;
    tipo: string;
    destinatario?: number;
    destinatario_nombre?: string;
    creado_por?: number;
    creado_por_nombre?: string;
}
