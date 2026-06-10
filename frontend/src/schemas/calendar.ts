import { z } from 'zod';

export const taskSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    event_type: z.enum(['EVALUACION', 'REUNION', 'VISITA', 'TAREA', 'OTRO']),
    priority: z.enum(['BAJA', 'MEDIA', 'ALTA']),
    status: z.enum(['PENDIENTE', 'COMPLETADO', 'CANCELADO']),
    start_time: z.string().min(1, "Fecha inicio requerida"),
    end_time: z.string().min(1, "Fecha fin requerida"),
    assigned_to: z.union([z.string(), z.number(), z.null()]).optional(),
    alumno: z.union([z.string(), z.number(), z.null()]).optional(),
    escuela: z.union([z.string(), z.number(), z.null()]).optional(),
    color: z.string(),
});

export type TaskForm = z.infer<typeof taskSchema>;
