export type CalendarEventType = 'EVALUACION' | 'REUNION' | 'VISITA' | 'TAREA' | 'OTRO';
export type CalendarStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
export type CalendarPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: CalendarEventType;
    status: CalendarStatus;
    priority: CalendarPriority;
    created_by: number;
    assigned_to: number;
    alumno?: number;
    escuela?: number;
    color: string;
    created_by_nombre?: string;
    assigned_to_nombre?: string;
    alumno_nombre?: string;
    escuela_nombre?: string;
}
