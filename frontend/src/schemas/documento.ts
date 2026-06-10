import { z } from 'zod';

export const documentoFormSchema = z.object({
    alumno: z.string().min(1, "Selecciona un alumno"),
    informe_deteccion: z.any().optional(),
    informe_psicopedagogico: z.any().optional(),
    plan_intervencion: z.any().optional(),
    observaciones: z.string().optional(),
});

export type DocumentoForm = z.infer<typeof documentoFormSchema>;
