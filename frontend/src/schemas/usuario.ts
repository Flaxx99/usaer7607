import { z } from 'zod';

export const ROLES_OPTIONS = [
    { value: 'ADMIN', label: 'Administrador del Sistema' }, 
    { value: 'DIRECTOR', label: 'Director(a)' },
    { value: 'MAESTRO_APOYO', label: 'Maestro(a) de Apoyo' },
    { value: 'PSICOLOGO', label: 'Psicólogo(a)' },
    { value: 'TRAB_SOCIAL', label: 'Trabajador(a) Social' },
    { value: 'COMUNICACION', label: 'Mtro. Comunicación' },
    { value: 'PSICOMOTRICIDAD', label: 'Mtro. Psicomotricidad' },
    { value: 'TRAB_MANUAL', label: 'Trabajador Manual' },
    { value: 'SECRETARIO', label: 'Secretario(a)' },
];

export const SITUACION_OPTIONS = [
    { value: 'BASE', label: 'Base' },
    { value: 'INTERINO', label: 'Interino' },
    { value: 'CONTRATO', label: 'Contrato' },
];

export const usuarioSchema = z.object({
    email: z.string().email('Correo electrónico inválido').min(1, 'El correo es obligatorio'),
    password: z.string().min(5, 'Mínimo 5 caracteres').optional().or(z.literal('')),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido_paterno: z.string().min(1, 'El apellido paterno es obligatorio'),
    apellido_materno: z.string().optional(),
    rfc: z.string().optional(),
    curp: z.string().optional(),
    role: z.string().min(1, 'El rol es obligatorio'),
    escuela: z.union([z.string(), z.number(), z.null()]).optional(),
    telefono: z.string().optional(),
    celular: z.string().optional(),
    domicilio: z.string().optional(),
    nivel: z.string().optional(),
    situacion: z.string().optional(),
    numero_empleado: z.string().optional(),
    activo: z.boolean(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;
