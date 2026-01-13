// src/api/documentos.ts
import client from './client';
import type { Expediente } from '../interfaces/documentos';

// Convertir JSON a FormData para subida de archivos
const buildFormData = (data: Expediente) => {
    const formData = new FormData();

    formData.append('alumno', data.alumno.toString());
    formData.append('observaciones', data.observaciones || '');

    // --- CORRECCIÓN ---
    // Verificamos explícitamente que NO sea un string (URL antigua)
    // Solo procesamos si es un FileList (input nuevo) o File directo

    // 1. Informe Detección
    if (data.informe_deteccion && typeof data.informe_deteccion !== 'string') {
        if ((data.informe_deteccion as any).length > 0) {
             // Es un FileList del input, tomamos el primero
            formData.append('informe_deteccion', (data.informe_deteccion as any)[0]);
        } else if (data.informe_deteccion instanceof File) {
             // Es un File directo
            formData.append('informe_deteccion', data.informe_deteccion);
        }
    }

    // 2. Informe Psicopedagógico
    if (data.informe_psicopedagogico && typeof data.informe_psicopedagogico !== 'string') {
        if ((data.informe_psicopedagogico as any).length > 0) {
            formData.append('informe_psicopedagogico', (data.informe_psicopedagogico as any)[0]);
        } else if (data.informe_psicopedagogico instanceof File) {
            formData.append('informe_psicopedagogico', data.informe_psicopedagogico);
        }
    }

    // 3. Plan de Intervención
    if (data.plan_intervencion && typeof data.plan_intervencion !== 'string') {
        if ((data.plan_intervencion as any).length > 0) {
            formData.append('plan_intervencion', (data.plan_intervencion as any)[0]);
        } else if (data.plan_intervencion instanceof File) {
            formData.append('plan_intervencion', data.plan_intervencion);
        }
    }

    // Archivos Extra
    if (data.nuevos_archivos_temp && data.nuevos_archivos_temp.length > 0) {
        data.nuevos_archivos_temp.forEach((item) => {
            formData.append('nuevos_archivos_extra', item.file);
            formData.append('nuevos_archivos_descripciones', item.descripcion);
        });
    }

    return formData;
};

export const getDocumentos = async (): Promise<Expediente[]> => {
    const response = await client.get('/documentos/');
    if (response.data.results) return response.data.results;
    return response.data;
};

export const createDocumento = async (data: Expediente): Promise<Expediente> => {
    const formData = buildFormData(data);
    const response = await client.post('/documentos/', formData, {
        headers: { 'Content-Type': undefined } as any 
    });
    return response.data;
};

export const updateDocumento = async (data: Expediente): Promise<Expediente> => {
    const formData = buildFormData(data);
    const response = await client.patch(`/documentos/${data.id}/`, formData, {
        headers: { 'Content-Type': undefined } as any
    });
    return response.data;
};

export const deleteDocumento = async (id: number): Promise<void> => {
    await client.delete(`/documentos/${id}/`);
};

export const deleteArchivoExtra = async (expedienteId: number, archivoId: number): Promise<void> => {
    await client.delete(`/documentos/${expedienteId}/eliminar-archivo-extra/${archivoId}/`);
};