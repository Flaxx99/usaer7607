import { z } from 'zod';

export const alumnoSchema = z.object({
    nombres: z.string().min(1, 'El nombre es obligatorio'),
    apellido_paterno: z.string().min(1, 'El apellido paterno es obligatorio'),
    apellido_materno: z.string().optional(),
    curp: z.string().min(18, 'CURP debe tener 18 caracteres').max(18, 'CURP debe tener 18 caracteres'),
    fecha_nacimiento: z.string().min(1, 'Fecha de nacimiento obligatoria'),
    sexo: z.enum(['H', 'M'], { message: 'Seleccione sexo' }),
    escuela: z.union([z.string(), z.number(), z.null()]).refine(val => val !== undefined && val !== '', { message: 'La escuela es obligatoria' }),
    profesor: z.union([z.string(), z.number(), z.null()]).optional(),
    grado: z.string().min(1, 'El grado es obligatorio'),
    grupo: z.string().min(1, 'El grupo es obligatorio'),
    clasificacion: z.string().min(1, 'La clasificación es obligatoria'),
    clasificacion_otro: z.string().optional(),
    activo: z.boolean(),
});

export type AlumnoFormData = z.infer<typeof alumnoSchema>;

export const CLASIFICACIONES_OPCIONES = [
  { value: 'NINGUNO', label: 'NINGUNO (En evaluación)' },
  { value: 'DISCAPACIDAD', label: 'DISCAPACIDAD' },
  { value: 'DIFICULTADES_SEVERAS', label: 'DIFICULTADES SEVERAS' },
  { value: 'TRASTORNOS', label: 'TRASTORNOS (TDAH, TEA...)' },
  { value: 'APTITUDES_SOBRESALIENTES', label: 'APTITUDES SOBRESALIENTES' },
  { value: 'OTRO', label: 'OTRO (Especifique)' }
];
