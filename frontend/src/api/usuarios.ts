import client from './client';
import type { Usuario } from '../interfaces/usuario';

// --- LEER TODOS (Para el Admin) ---
export const getUsuarios = async (): Promise<Usuario[]> => {
    const response = await client.get('/usuarios/');
    
    // CASO 1: Django devuelve paginación estándar (objeto con .results)
    if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    
    // CASO 2: Django devuelve una lista directa (sin paginación)
    if (Array.isArray(response.data)) {
        return response.data;
    }

    // CASO 3: Respuesta inesperada
    console.error("Formato de respuesta inesperado en usuarios:", response.data);
    return [];
};

// --- LEER SOLO MAESTROS (Para el Select de Alumnos) ---
export const getMaestros = async (): Promise<Usuario[]> => {
    const response = await client.get('/usuarios/'); 
    
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
    // 1. Clonamos el objeto para manipularlo sin afectar al formulario
    const datosEnvio = { ...data };

    // 2. Quitamos el ID del cuerpo (ya va en la URL)
    // A veces Django se queja si mandas el ID en el body y no coincide o lo interpreta mal.
    delete (datosEnvio as any).id;

    // 3. LIMPIEZA DE PASSWORD
    // Si viene vacío o solo espacios, lo borramos para que Django lo ignore
    if (!datosEnvio.password || String(datosEnvio.password).trim() === '') {
        delete datosEnvio.password;
    }

    // 4. LIMPIEZA DE ESCUELA (ForeignKey)
    // Si es string vacío o null, enviamos null
    if (!datosEnvio.escuela || String(datosEnvio.escuela) === "") {
        datosEnvio.escuela = null;
    } else {
        // Aseguramos que sea número
        datosEnvio.escuela = Number(datosEnvio.escuela);
    }

    // 5. LIMPIEZA DE CAMPOS OPCIONALES (Para evitar enviar "" en campos numéricos o fechas)
    if (datosEnvio.numero_empleado === "") delete datosEnvio.numero_empleado;
    if (datosEnvio.rfc === "") delete datosEnvio.rfc;
    if (datosEnvio.curp === "") delete datosEnvio.curp;

    // 6. LIMPIEZA DE CAMPOS DE SOLO LECTURA (Read-Only)
    // Eliminamos objetos anidados o campos calculados
    delete (datosEnvio as any).escuela_detalle;
    delete (datosEnvio as any).nombre_completo;
    delete (datosEnvio as any).antiguedad;
    delete (datosEnvio as any).fecha_ingreso; // Usualmente no se edita aquí
    delete (datosEnvio as any).last_login;
    delete (datosEnvio as any).date_joined;

    try {
        const response = await client.patch(`/usuarios/${data.id}/`, datosEnvio);
        return response.data;
    } catch (error: any) {
        // ESTO ES CLAVE: Imprime en consola el error exacto del servidor
        console.error("Error UPDATE usuario DETALLE:", error.response?.data);
        throw error;
    }
};

// --- ELIMINAR ---
export const deleteUsuario = async (id: number): Promise<void> => {
    await client.delete(`/usuarios/${id}/`);
};