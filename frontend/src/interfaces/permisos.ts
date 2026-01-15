export type EstadoPermiso = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type TipoPermiso = 'PERSONAL' | 'ENFERMEDAD' | 'COMISION' | 'LLEGADA_TARDE' | 'SALIDA_TEMPRANA';

export interface Permiso {
    id: number;
    tipo: TipoPermiso;
    fecha_inicio: string;
    fecha_fin: string;
    horas_solicitadas?: string | null; // Decimal como string
    motivo: string;
    estado: EstadoPermiso;
    respuesta_admin?: string;
    
    // Relaciones (Solo lectura)
    profesor: number;
    profesor_nombre: string;
    escuela: number;
    escuela_nombre: string;
    administrador_nombre?: string;
    
    fecha_solicitud: string;
    fecha_respuesta?: string;
    duracion_dias: number;
}

export interface MetricasPermisos {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    ultima_semana: number;
}