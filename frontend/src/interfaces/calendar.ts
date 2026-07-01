// Re-exportado desde api.ts (generado de pydantic EventoCalendarioResponse).
export type { EventoCalendarioResponse as CalendarEvent } from './api';

// Los tipos Literal están incluidos en EventoCalendarioResponse,
// pero se exportan por separado para uso directo en el frontend.
export type CalendarEventType = 'EVALUACION' | 'REUNION' | 'VISITA' | 'TAREA' | 'OTRO';
export type CalendarStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
export type CalendarPriority = 'BAJA' | 'MEDIA' | 'ALTA';
