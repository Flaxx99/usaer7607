// ============================================================
// api.ts - Tipos generados automaticamente desde pydantic
// NO EDITES A MANO. Ejecuta: python scripts/generate_types.py
// ============================================================

// --- Helpers -------------------------------------------------

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface AvisoDTO {
    id: number;
    titulo: string;
    contenido: string;
    autor: string;
    fecha: string /* ISO datetime */;
}

export interface StatsDTO {
    total_alumnos: number | undefined;
    total_escuelas: number | undefined;
    total_usuarios: number | undefined;
    total_maestros: number | undefined;
}

export interface DashboardData {
    ciclo_actual: string | undefined;
    ultimos_avisos: AvisoDTO[] | undefined;
    permisos_pendientes: number | undefined;
    incidencias_pendientes: number | undefined;
    stats: StatsDTO | undefined;
    grafica_clasificacion: ChartEntry[] | undefined;
    grafica_escuelas: GraficaEscuelaEntry[] | undefined;
}

export interface GraficaEscuelaEntry {
    escuela__nombre: string | undefined;
    total: number | undefined;
}

export interface ChartEntry {
    clasificacion: string | undefined;
    total: number | undefined;
}

export interface StatusDetailResponse {
    status: string | undefined;
    detail: string | undefined;
}

export interface UnreadCountResponse {
    unread_count: number;
}

export interface ToggleActiveResponse {
    status: string;
    activo: boolean;
}

export interface MetricasPermisoResponse {
    total: number | undefined;
    pendientes: number | undefined;
    aprobados: number | undefined;
    rechazados: number | undefined;
    ultima_semana: number | undefined;
}

export interface PromocionExecResponse {
    status: string | undefined;
    detail: string | undefined;
    promovidos: number | undefined;
    graduados: number | undefined;
}

export interface AlumnoPromoverResponse {
    simulation: boolean;
    ciclo_actual: string | undefined;
    total_pendientes: number | undefined;
    a_promover: number | undefined;
    a_graduar: number | undefined;
    omitidos: number | undefined;
    promovidos: Record<string, any>[] | undefined;
    graduados: Record<string, any>[] | undefined;
    omitidos_detalle: Record<string, any>[] | undefined;
}

export interface AlumnoPromoverCommitResponse {
    simulation: false | undefined;
    ciclo_promocion: string | undefined;
    promovidos_count: number | undefined;
    graduados_count: number | undefined;
    errores: string[] | undefined;
    detail: string | undefined;
}

export interface PromocionPreviewResponse {
    total_activos: number | undefined;
    a_promover_count: number | undefined;
    a_graduar_count: number | undefined;
    errores_count: number | undefined;
    detalles_promover: string[] | undefined;
    detalles_graduar: string[] | undefined;
    detalles_errores: string[] | undefined;
}

export interface CerrarRegistroResponse {
    detail: string;
    registro_id: number;
    cerrado: boolean;
}

export interface ErrorResponse {
    detail: string;
    code: string | undefined;
}

export interface ValidationErrorDetail {
    field: string | undefined;
    message: string;
}

export interface ValidationErrorResponse {
    detail: string | undefined;
    code: string | undefined;
    errors: ValidationErrorDetail[] | undefined;
}
