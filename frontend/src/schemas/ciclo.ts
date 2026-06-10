import { z } from 'zod';

export const cicloSchema = z.object({
    nombre: z.string().min(1, 'El nombre del ciclo es obligatorio').max(50, 'Demasiado largo'),
    fecha_inicio: z.string().min(1, 'Fecha de inicio obligatoria'),
    fecha_fin: z.string().min(1, 'Fecha de fin obligatoria'),
    activo: z.boolean(),
}).refine((data) => {
    if (data.fecha_inicio && data.fecha_fin) {
        return new Date(data.fecha_inicio) <= new Date(data.fecha_fin);
    }
    return true;
}, {
    message: "La fecha de inicio debe ser anterior o igual a la de fin",
    path: ["fecha_fin"],
});

export type CicloFormData = z.infer<typeof cicloSchema>;
