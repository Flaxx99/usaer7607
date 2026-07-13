import client from './client';
import type { Usuario } from '../interfaces/usuario';
import type { PaginatedResponse } from '../interfaces/common';

// --- LEER TODOS PAGINADOS (Para el Admin) ---
export const getUsuarios = async (page = 1, search = '', role = '', escuela = '', activo = ''): Promise<PaginatedResponse<Usuario>> => {
    const response = await client.get('/usuarios/', {
        params: { page, ...(search && { search }), ...(role && { role }), ...(escuela && { escuela }), ...(activo && { activo }) },
    });
    
    // Si viene la respuesta estructurada de DRF, la retornamos tal cual.
    if (response.data && response.data.results) {
        return response.data;
    }
    
    // Caso alternativo si no está paginado
    return {
        count: Array.isArray(response.data) ? response.data.length : 0,
        next: null,
        previous: null,
        results: Array.isArray(response.data) ? response.data : []
    };
};

// --- LEER SOLO MAESTROS (Para el Select de Alumnos) ---
// Usamos page_size=1000 para cargar todos los maestros en una sola consulta
export const getMaestros = async (): Promise<Usuario[]> => {
    const response = await client.get('/usuarios/?page_size=1000'); 
    
    let todos: Usuario[] = [];
    if (response.data && Array.isArray(response.data.results)) {
        todos = response.data.results;
    } else if (Array.isArray(response.data)) {
        todos = response.data;
    }
    
    // Filtramos solo los que son MAESTRO_APOYO
    return todos.filter((u: Usuario) => u.role === 'MAESTRO_APOYO'); 
};

// --- CREAR ---
export const createUsuario = async (data: Usuario): Promise<Usuario> => {
    try {
        const response = await client.post('/usuarios/', data);
        return response.data;
    } catch (error: unknown) {
        console.error("Error CREATE usuario:", (error as { response?: { data?: unknown } }).response?.data);
        throw error;
    }
};

// --- ACTUALIZAR ---
export const updateUsuario = async (data: Usuario): Promise<Usuario> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, escuela_detalle, nombre_completo, antiguedad, fecha_ingreso, ...datosEnvioRaw } = data;

    const datosEnvio: Record<string, unknown> = { ...datosEnvioRaw as unknown as Record<string, unknown> };

    // password: campo write-only, no está en UsuarioResponse pero sí en el form
    const rawData = data as unknown as Record<string, unknown>;
    const password = rawData.password as string | undefined;
    if (!password || String(password).trim() === '') {
        delete datosEnvio.password;
    }

    // escuela: null cuando está vacío
    if (!datosEnvio.escuela || String(datosEnvio.escuela) === "") {
        datosEnvio.escuela = null;
    } else {
        datosEnvio.escuela = Number(datosEnvio.escuela);
    }

    if (datosEnvio.numero_empleado === "") delete datosEnvio.numero_empleado;
    if (datosEnvio.rfc === "") delete datosEnvio.rfc;
    if (datosEnvio.curp === "") delete datosEnvio.curp;

    try {
        const response = await client.patch(`/usuarios/${id}/`, datosEnvio);
        return response.data;
    } catch (error: unknown) {
        console.error("Error UPDATE usuario DETALLE:", (error as { response?: { data?: unknown } }).response?.data);
        throw error;
    }
};

// --- ELIMINAR ---
export const deleteUsuario = async (id: number): Promise<void> => {
    await client.delete(`/usuarios/${id}/`);
};

// --- CAMBIAR CONTRASEÑA (admin) ---
export const changePassword = async (id: number, newPassword: string): Promise<void> => {
    await client.post(`/usuarios/${id}/change-password/`, { new_password: newPassword });
};

// --- ACTIVAR / DESACTIVAR ---
export const toggleActive = async (id: number): Promise<{ status: string; activo: boolean }> => {
    const response = await client.post(`/usuarios/${id}/toggle-active/`);
    return response.data;
};
