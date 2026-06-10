import { z } from 'zod';

export const escuelaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    cct: z.string().min(1, 'El CCT es obligatorio').max(10, 'CCT demasiado largo'),
    clave_estatal: z.string().min(1, 'La clave estatal es obligatoria'),
    nivel: z.string().min(1, 'El nivel es obligatorio'),
    zona: z.string().min(1, 'La zona es obligatoria'),
    domicilio: z.string().min(1, 'El domicilio es obligatorio'),
    colonia: z.string().min(1, 'La colonia es obligatoria'),
});

export type EscuelaFormData = z.infer<typeof escuelaSchema>;

export const NIVELES_OPCIONES = [
  { value: 'Primaria', label: '🏫 Primaria' },
  { value: 'Preescolar', label: '🧸 Preescolar' },
  { value: 'Secundaria', label: '🎓 Secundaria' },
  { value: 'Telesecundaria', label: '📡 Telesecundaria' },
];
