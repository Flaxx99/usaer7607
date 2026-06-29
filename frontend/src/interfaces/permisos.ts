export type EstadoPermiso = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type TipoPermiso = 'PERSONAL' | 'ENFERMEDAD' | 'COMISION' | 'LLEGADA_TARDE' | 'SALIDA_TEMPRANA';

// Re-exportado desde api.ts (generado de pydantic).
export type { PermisoResponse as Permiso } from './api';
export type { MetricasPermisoResponse as MetricasPermisos } from './api';