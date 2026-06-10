import { z } from 'zod';

export const avisoFormSchema = z.object({
    titulo: z.string().min(1, "El título es obligatorio"),
    contenido: z.string().min(1, "El contenido es obligatorio"),
    fecha_publicacion: z.string().min(1, "Fecha de publicación requerida"),
    fecha_expiracion: z.string().nullable().optional(),
});

export type AvisoForm = z.infer<typeof avisoFormSchema>;
