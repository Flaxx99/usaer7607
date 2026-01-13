// src/interfaces/usuario
// .ts

export interface Usuario {
    id: number;
    email: string;
    numero_empleado?: string;
    role: string;
    
    // Datos Personales (Coinciden con tu Serializer)
    nombre: string;         // Backend: nombre
    apellido_paterno: string; 
    apellido_materno?: string;
    nombre_completo?: string; // ReadOnly
    
    // Relación Escuela
    escuela?: number | null; // ID para enviar (escritura)
    // Objeto detalle para leer (lectura)
    escuela_detalle?: { 
        id: number; 
        nombre: string; 
        clave_estatal: string; 
        nivel: string; 
    }; 
    
    // Contacto
    telefono?: string;
    celular?: string;
    domicilio?: string;
    
    // Fiscal / Legal
    rfc?: string;
    curp?: string;
    
    // Laboral
    nivel?: string;
    grado?: string;
    situacion?: string;
    fecha_ingreso?: string;
    antiguedad?: string; // ReadOnly
    
    activo: boolean; // Backend: activo
    password?: string; // Opcional (solo escritura)
    is_superuser?: boolean;
}