export interface ApiError {
    detail?: string;
    code?: string;
    // Django suele mandar errores por campo, ej: { email: ["Email inválido"] }
    [key: string]: string | string[] | undefined; 
}