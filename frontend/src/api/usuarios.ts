import client from './client';
import type { Usuario } from '../interfaces/usuario';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// --- LEER TODOS PAGINADOS (Para el Admin) ---
export const getUsuarios = async (page = 1, search = '', role = '', escuela = '', activo = ''): Promise<PaginatedResponse<Usuario>> => {
    let url = `/usuarios/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role) url += `&role=${role}`;
    if (escuela) url += `&escuela=${escuela}`;
    if (activo) url += `&activo=${activo}`;

    const response = await client.get(url);
    
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
    } catch (error: any) {
        console.error("Error CREATE usuario:", error.response?.data);
        throw error;
    }
};

// --- ACTUALIZAR ---
export const updateUsuario = async (data: Usuario): Promise<Usuario> => {
    const datosEnvio = { ...data };
    delete (datosEnvio as any).id;

    if (!datosEnvio.password || String(datosEnvio.password).trim() === '') {
        delete datosEnvio.password;
    }

    if (!datosEnvio.escuela || String(datosEnvio.escuela) === "") {
        datosEnvio.escuela = null;
    } else {
        datosEnvio.escuela = Number(datosEnvio.escuela);
    }

    if (datosEnvio.numero_empleado === "") delete datosEnvio.numero_empleado;
    if (datosEnvio.rfc === "") delete datosEnvio.rfc;
    if (datosEnvio.curp === "") delete datosEnvio.curp;

    delete (datosEnvio as any).escuela_detalle;
    delete (datosEnvio as any).nombre_completo;
    delete (datosEnvio as any).antiguedad;
    delete (datosEnvio as any).fecha_ingreso;
    delete (datosEnvio as any).last_login;
    delete (datosEnvio as any).date_joined;

    try {
        const response = await client.patch(`/usuarios/${data.id}/`, datosEnvio);
        return response.data;
    } catch (error: any) {
        console.error("Error UPDATE usuario DETALLE:", error.response?.data);
        throw error;
    }
};

// --- ELIMINAR ---
export const deleteUsuario = async (id: number): Promise<void> => {
    await client.delete(`/usuarios/${id}/`);
};
