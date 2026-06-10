import { z } from 'zod';

export const racSchema = z.object({
    clasificacion: z.string().min(1, 'La clasificación es obligatoria'),
    subclasificacion: z.string().min(1, 'La subclasificación es obligatoria'),
    observaciones: z.string().optional(),
});

export type RACFormData = z.infer<typeof racSchema>;

interface SubclasificacionOption {
    value: string;
    label: string;
}

export const CLASIFICACION_SUB: Record<string, SubclasificacionOption[]> = {
    'DISCAPACIDAD': [
        { value: 'DI', label: 'Discapacidad intelectual' },
        { value: 'DMO', label: 'Discapacidad motriz' },
        { value: 'SO', label: 'Sordera' },
        { value: 'HP', label: 'Hipoacusia' },
        { value: 'CEG', label: 'Ceguera' },
        { value: 'BV', label: 'Baja visión' },
        { value: 'DM', label: 'Discapacidad múltiple' },
        { value: 'SCG', label: 'Sordoceguera' },
        { value: 'DME', label: 'Discapacidad mental o psicosocial' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'DIFICULTADES_SEVERAS': [
        { value: 'DSC', label: 'Dificultades severas de conducta' },
        { value: 'DSCO', label: 'Dificultades severas de comunicación' },
        { value: 'DSA', label: 'Dificultades severas de aprendizaje' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'TRASTORNOS': [
        { value: 'TEA', label: 'Trastorno del espectro autista' },
        { value: 'TDAH', label: 'Trastorno por Déficit de Atención e Hiperactividad' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
    'APTITUDES_SOBRESALIENTES': [
        { value: 'ASI', label: 'Aptitudes sobresalientes intelectuales' },
        { value: 'ASC', label: 'Aptitudes sobresalientes creativas' },
        { value: 'ASS', label: 'Aptitudes sobresalientes socioafectivas' },
        { value: 'ASA', label: 'Aptitudes sobresalientes artísticas' },
        { value: 'ASP', label: 'Aptitudes sobresalientes psicomotrices' },
        { value: 'NO_APLICA', label: 'No aplica' },
    ],
};

export const CLASIFICACIONES = Object.keys(CLASIFICACION_SUB).map(k => ({ 
    value: k, 
    label: k.replace('_', ' ') 
}));
