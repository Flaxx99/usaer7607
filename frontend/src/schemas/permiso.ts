import { z } from 'zod';

export const createPermisoSchema = z.object({
    tipo: z.string().min(1, 'El tipo de permiso es obligatorio'),
    fecha_inicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
    fecha_fin: z.string().min(1, 'La fecha de fin es obligatoria'),
    horas_solicitadas: z.number().min(0.5, 'Mínimo 0.5 horas').max(8, 'Máximo 8 horas').optional().nullable(),
    motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
});

export type CreatePermisoFormData = z.infer<typeof createPermisoSchema>;

export const STATE_COLORS: Record<string, string> = {
  PENDIENTE: 'badge-warning',
  APROBADO: 'badge-success',
  RECHAZADO: 'badge-error',
};

export const TIPOS_PERMISO = [
  { value: 'PERSONAL', label: 'Asuntos Personales' },
  { value: 'ENFERMEDAD', label: 'Enfermedad / Licencia Médica' },
  { value: 'COMISION', label: 'Comisión Oficial' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde (Parcial)' },
  { value: 'SALIDA_TEMPRANA', label: 'Salida Temprana (Parcial)' },
];
