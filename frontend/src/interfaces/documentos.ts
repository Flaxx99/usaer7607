// src/interfaces/documentos.ts
//
// Re-exportado desde api.ts (generado de pydantic OtroArchivoResponse).
export type { OtroArchivoResponse as OtroArchivo } from './api';

// ExpedienteResponse está disponible para consumo puro de GET.
import type { ExpedienteResponse as _ExpedienteResponse } from './api';
export type { ExpedienteResponse } from './api';

// Expediente híbrido: extiende la respuesta GET con tipos de formulario.
// Los campos FileField son string (URL) en la respuesta, pero
// File/FileList al enviar desde un formulario con <input type="file">.
export interface Expediente extends Omit<_ExpedienteResponse,
    'informe_deteccion' | 'informe_psicopedagogico' | 'plan_intervencion'
> {
    informe_deteccion?: string | File | FileList | null;
    informe_psicopedagogico?: string | File | FileList | null;
    plan_intervencion?: string | File | FileList | null;
    // Solo frontend — para acumular archivos extra antes de enviar
    nuevos_archivos_temp?: { file: File; descripcion: string }[];
}
