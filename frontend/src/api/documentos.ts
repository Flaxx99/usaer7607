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

    // Helper para extraer un File desde File | FileList | null
    const getFile = (field: File | FileList | null | undefined): File | null => {
        if (!field) return null;
        if (field instanceof FileList && field.length > 0) return field[0];
        if (field instanceof File) return field;
        return null;
    };

    // 1. Informe Detección
    if (data.informe_deteccion && typeof data.informe_deteccion !== 'string') {
        const file = getFile(data.informe_deteccion);
        if (file) formData.append('informe_deteccion', file);
    }

    // 2. Informe Psicopedagógico
    if (data.informe_psicopedagogico && typeof data.informe_psicopedagogico !== 'string') {
        const file = getFile(data.informe_psicopedagogico);
        if (file) formData.append('informe_psicopedagogico', file);
    }

    // 3. Plan de Intervención
    if (data.plan_intervencion && typeof data.plan_intervencion !== 'string') {
        const file = getFile(data.plan_intervencion);
        if (file) formData.append('plan_intervencion', file);
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
        headers: { 'Content-Type': undefined } as unknown as import('axios').RawAxiosRequestHeaders
    });
    return response.data;
};

export const updateDocumento = async (data: Expediente): Promise<Expediente> => {
    const formData = buildFormData(data);
    const response = await client.patch(`/documentos/${data.id}/`, formData, {
        headers: { 'Content-Type': undefined } as unknown as import('axios').RawAxiosRequestHeaders
    });
    return response.data;
};

export const deleteDocumento = async (id: number): Promise<void> => {
    await client.delete(`/documentos/${id}/`);
};

export const deleteArchivoExtra = async (expedienteId: number, archivoId: number): Promise<void> => {
    await client.delete(`/documentos/${expedienteId}/eliminar-archivo-extra/${archivoId}/`);
};