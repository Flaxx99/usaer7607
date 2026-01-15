export interface CicloEscolar {
    id: number;
    nombre: string;       // Ej. "2024-2025"
    fecha_inicio: string; // YYYY-MM-DD
    fecha_fin: string;    // YYYY-MM-DD
    activo: boolean;      // Tu campo "switch"
}

// Interfaz para la respuesta de la simulación de promoción
export interface PromocionPreview {
    total_activos: number;
    a_promover_count: number;
    a_graduar_count: number;
    errores_count: number;
    detalles_promover?: string[];
    detalles_graduar?: string[];
    detalles_errores?: string[];
}