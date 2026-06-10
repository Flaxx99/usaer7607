import { z } from 'zod';

export const incidenciaSchema = z.object({
    titulo: z.string().min(1, "El título es obligatorio"),
    descripcion: z.string().min(1, "La descripción es obligatoria"),
    profesor: z.string().min(1, "Debe seleccionar al involucrado"),
});

export const resolverSchema = z.object({
    respuesta: z.string().min(1, "Debe ingresar una justificación oficial"),
});

export type IncidenciaForm = z.infer<typeof incidenciaSchema>;
export type ResolverForm = z.infer<typeof resolverSchema>;
