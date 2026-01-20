export interface Asistencia {
    id: number;
    profesor: number;
    profesor_nombre: string;
    escuela: number;
    escuela_nombre: string;
    fecha: string;
    presente: boolean;
    hora_entrada: string;       // Formato HH:MM:SS
    hora_salida?: string | null; // Formato HH:MM:SS
}

export interface RespuestaChecador {
    message: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'ERROR';
    profesor: string;
    hora: string;
    detalle?: string; // Para horas trabajadas o errores
}