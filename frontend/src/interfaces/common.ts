/** Respuesta paginada estándar del backend (PageNumberPagination). */
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
