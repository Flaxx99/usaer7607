import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, "El usuario es obligatorio"),
    password: z.string().min(3, "La contraseña debe tener al menos 3 caracteres"),
});

export type LoginForm = z.infer<typeof loginSchema>;
