// src/interfaces/ciclo.ts
//
// PromocionPreview y PromocionResult se re-exportan desde api.ts (generado).
// CicloEscolar es manual (sin pydantic equivalente).

export type {
    PromocionPreviewResponse as PromocionPreview,
    PromocionExecResponse as PromocionResult,
} from './api';

export interface CicloEscolar {
    id: number;
    nombre: string;       // Ej. "2024-2025"
    fecha_inicio: string; // YYYY-MM-DD
    fecha_fin: string;    // YYYY-MM-DD
    activo: boolean;      // Tu campo "switch"
}
