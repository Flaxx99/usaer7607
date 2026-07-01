// ============================================================
// api.ts - Tipos generados automaticamente desde pydantic
// NO EDITES A MANO. Ejecuta: python scripts/generate_types.py
// ============================================================

// --- Helpers -------------------------------------------------

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface AvisoDTO {
    id: number;
    titulo: string;
    contenido: string;
    autor: string;
    fecha: string /* ISO datetime */;
}

export interface StatsDTO {
    total_alumnos: number | undefined;
    total_escuelas: number | undefined;
    total_usuarios: number | undefined;
    total_maestros: number | undefined;
}

export interface DashboardData {
    ciclo_actual: string | undefined;
    ultimos_avisos: AvisoDTO[] | undefined;
    permisos_pendientes: number | undefined;
    incidencias_pendientes: number | undefined;
    stats: StatsDTO | undefined;
    grafica_clasificacion: ChartEntry[] | undefined;
    grafica_escuelas: GraficaEscuelaEntry[] | undefined;
    racs_pendientes: number | undefined;
    actividad_reciente: ActividadRecienteDTO[] | undefined;
    eventos_hoy: Record<string, unknown>[] | undefined;
}

export interface ActividadRecienteDTO {
    tipo: string;
    descripcion: string;
    fecha: string /* ISO datetime */;
    url: string | undefined;
}

export interface GraficaEscuelaEntry {
    escuela__nombre: string | undefined;
    total: number | undefined;
}

export interface ChartEntry {
    clasificacion: string | undefined;
    total: number | undefined;
}

export interface StatusDetailResponse {
    status: string | undefined;
    detail: string | undefined;
}

export interface UnreadCountResponse {
    unread_count: number;
}

export interface ToggleActiveResponse {
    status: string;
    activo: boolean;
}

export interface MetricasPermisoResponse {
    total: number | undefined;
    pendientes: number | undefined;
    aprobados: number | undefined;
    rechazados: number | undefined;
    ultima_semana: number | undefined;
}

export interface PermisoResponse {
    id: number;
    tipo: 'PERSONAL' | 'ENFERMEDAD' | 'COMISION' | 'LLEGADA_TARDE' | 'SALIDA_TEMPRANA';
    fecha_inicio: string;
    fecha_fin: string;
    horas_solicitadas: string | undefined;
    motivo: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    respuesta_admin: string | undefined;
    profesor: number;
    profesor_nombre: string;
    escuela: number;
    escuela_nombre: string;
    administrador_nombre: string | undefined;
    fecha_solicitud: string;
    fecha_respuesta: string | undefined;
    duracion_dias: number;
}

export interface IncidenciaResponse {
    id: number;
    titulo: string;
    descripcion: string;
    escuela: number;
    escuela_nombre: string;
    profesor: number;
    profesor_nombre: string;
    reportado_por: number;
    reportado_por_nombre: string;
    estado: 'PENDIENTE' | 'RESUELTA';
    respuesta_admin: string | undefined;
    fecha_reporte: string;
    fecha_resolucion: string | undefined;
}

export interface AnuncioResponse {
    id: number;
    titulo: string;
    contenido: string;
    fecha_publicacion: string;
    fecha_expiracion: string | undefined;
    autor: number;
    autor_nombre: string;
    es_activo: boolean;
}

export interface LoginResponse {
    detail: string | undefined;
    token: string;
    user: Record<string, any>;
}

export interface CicloEscolarResponse {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
}

export interface EscuelaResponse {
    id: number;
    clave_estatal: string;
    cct: string;
    nombre: string;
    nivel: 'PREESCOLAR' | 'PRIMARIA' | 'SECUNDARIA';
    domicilio: string;
    colonia: string;
    telefono: string | undefined;
    zona: string;
    inspector: string | undefined;
    telefono_inspector: string | undefined;
    correo_inspector: string | undefined;
    director: number | undefined;
    celular_director: string | undefined;
    correo_director: string | undefined;
}

export interface EscuelaSimpleResponse {
    id: number;
    nombre: string;
    clave_estatal: string;
    nivel: string;
    zona: string;
}

export interface NotificacionResponse {
    id: number;
    mensaje: string;
    leida: boolean;
    fecha_creacion: string;
    url: string | undefined;
}

export interface OficioResponse {
    id: number;
    titulo: string;
    descripcion: string;
    archivo: string;
    fecha_subida: string;
    subido_por: number;
    subido_por_nombre: string;
}

export interface AsistenciaResponse {
    id: number;
    profesor: number;
    profesor_nombre: string;
    escuela: number;
    escuela_nombre: string;
    fecha: string;
    presente: boolean;
    hora_entrada: string | undefined;
    hora_salida: string | undefined;
}

export interface AlumnoResponse {
    id: number;
    profesor: number | undefined;
    profesor_nombre: string;
    escuela: number;
    escuela_detalle: EscuelaSimpleResponse | undefined;
    escuela_nombre: string;
    apellido_paterno: string;
    apellido_materno: string | undefined;
    nombres: string;
    nombre_completo: string;
    curp: string;
    fecha_nacimiento: string | undefined;
    sexo: string;
    edad: number | undefined;
    grado: string;
    grupo: string | undefined;
    activo: boolean | undefined;
    clasificacion: string;
    clasificacion_otro: string | undefined;
}

export interface UsuarioResponse {
    id: number;
    email: string;
    numero_empleado: string | undefined;
    role: string;
    nombre: string | undefined;
    apellido_paterno: string | undefined;
    apellido_materno: string | undefined;
    nombre_completo: string | undefined;
    escuela: number | undefined;
    escuela_detalle: EscuelaSimpleResponse | undefined;
    telefono: string | undefined;
    celular: string | undefined;
    domicilio: string | undefined;
    rfc: string | undefined;
    curp: string | undefined;
    nivel: string | undefined;
    grado: string | undefined;
    situacion: string | undefined;
    fecha_ingreso: string | undefined;
    antiguedad: string | undefined;
    activo: boolean | undefined;
    is_superuser: boolean | undefined;
}

export interface PromocionExecResponse {
    status: string | undefined;
    detail: string | undefined;
    promovidos: number | undefined;
    graduados: number | undefined;
}

export interface AlumnoPromoverResponse {
    simulation: boolean;
    ciclo_actual: string | undefined;
    total_pendientes: number | undefined;
    a_promover: number | undefined;
    a_graduar: number | undefined;
    omitidos: number | undefined;
    promovidos: Record<string, any>[] | undefined;
    graduados: Record<string, any>[] | undefined;
    omitidos_detalle: Record<string, any>[] | undefined;
}

export interface AlumnoPromoverCommitResponse {
    simulation: false | undefined;
    ciclo_promocion: string | undefined;
    promovidos_count: number | undefined;
    graduados_count: number | undefined;
    errores: string[] | undefined;
    detail: string | undefined;
}

export interface PromocionPreviewResponse {
    total_activos: number | undefined;
    a_promover_count: number | undefined;
    a_graduar_count: number | undefined;
    errores_count: number | undefined;
    detalles_promover: string[] | undefined;
    detalles_graduar: string[] | undefined;
    detalles_errores: string[] | undefined;
}

export interface CerrarRegistroResponse {
    detail: string;
    registro_id: number;
    cerrado: boolean;
}

export interface ChecadorResponse {
    message: string;
    tipo: 'ENTRADA' | 'SALIDA';
    profesor: string;
    hora: string;
    detalle: string | undefined;
}

export interface EventoCalendarioResponse {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: 'EVALUACION' | 'REUNION' | 'VISITA' | 'TAREA' | 'OTRO' | undefined;
    status: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO' | undefined;
    priority: 'BAJA' | 'MEDIA' | 'ALTA' | undefined;
    color: string | undefined;
    created_by: number;
    created_by_nombre: string | undefined;
    assigned_to: number | undefined;
    assigned_to_nombre: string | undefined;
    alumno: number | undefined;
    alumno_nombre: string | undefined;
    escuela: number | undefined;
    escuela_nombre: string | undefined;
    start: string | undefined;
    end: string | undefined;
}

export interface ExpedienteResponse {
    id: number;
    alumno: number;
    profesor: number | undefined;
    informe_deteccion: string | undefined;
    informe_psicopedagogico: string | undefined;
    plan_intervencion: string | undefined;
    observaciones: string | undefined;
    fecha_subida: string | undefined;
    alumno_nombre: string | undefined;
    profesor_nombre: string | undefined;
    otros_archivos: OtroArchivoResponse[] | undefined;
}

export interface OtroArchivoResponse {
    id: number;
    archivo: string;
    descripcion: string;
    url_archivo: string | undefined;
    nombre_archivo: string | undefined;
}

export interface RACPendientesResponse {
    total_pendientes: number;
    ciclo: string;
}

export interface RAEAlumnoResponse {
    id: number;
    registro: number;
    alumno: number;
    capturado_por: number | undefined;
    curp: string | undefined;
    genero: string | undefined;
    edad: number | undefined;
    grado: string | undefined;
    ceg: boolean | undefined;
    bv: boolean | undefined;
    so: boolean | undefined;
    hp: boolean | undefined;
    scg: boolean | undefined;
    dmo: boolean | undefined;
    di: boolean | undefined;
    dme: boolean | undefined;
    psicosocial: boolean | undefined;
    dm: boolean | undefined;
    dsc: boolean | undefined;
    dsco: boolean | undefined;
    dsa: boolean | undefined;
    tda: boolean | undefined;
    tea: boolean | undefined;
    asi: boolean | undefined;
    asc: boolean | undefined;
    asa: boolean | undefined;
    asp: boolean | undefined;
    ass: boolean | undefined;
    ot: boolean | undefined;
    psicologia: boolean | undefined;
    comunicacion: boolean | undefined;
    psicomotricidad: boolean | undefined;
    trabajo_social: boolean | undefined;
    aprendizaje: boolean | undefined;
    nuevo_ingreso: boolean | undefined;
    subsecuente: boolean | undefined;
    diagnostico: boolean | undefined;
    educativo: boolean | undefined;
    deteccion: boolean | undefined;
    psicopedagogico: boolean | undefined;
    plan: boolean | undefined;
    modelo: boolean | undefined;
    alumno_nombre: string | undefined;
}

export interface RAEInitResponse {
    registro_id: number;
    ciclo: string;
    escuela: string;
    cerrado: boolean;
    alumnos: RAEAlumnoResponse[];
}

export interface RAEProgressItem {
    escuela_id: number;
    escuela_nombre: string;
    escuela_cct: string;
    registro_id: number;
    total_alumnos: number;
    completados: number;
    porcentaje: number;
    cerrado: boolean;
}

export interface RegistroRACResponse {
    id: number;
    alumno: number;
    ciclo_escolar: number;
    escuela_regular: number;
    zona_regular: string | undefined;
    curp: string | undefined;
    sexo: string | undefined;
    edad: number | undefined;
    grado: string | undefined;
    service_type: string | undefined;
    sup_especial_cct: string | undefined;
    sup_especial_zona: string | undefined;
    centro_cct: string | undefined;
    centro_nombre: string | undefined;
    maestro_apoyo: number;
    escuela_basica: number;
    clasificacion: string;
    subclasificacion: string;
    observaciones: string | undefined;
    fecha_registro: string | undefined;
    alumno_nombre: string | undefined;
    escuela_nombre: string | undefined;
    maestro_nombre: string | undefined;
    service_type_display: string | undefined;
}

export interface RegistroRAEResponse {
    id: number;
    escuela: number;
    ciclo_escolar: number;
    creado_por: number | undefined;
    fecha_creacion: string /* ISO datetime */;
    cerrado: boolean | undefined;
    docente_hombres: number | undefined;
    docente_mujeres: number | undefined;
    escuela_nombre: string | undefined;
    ciclo_nombre: string | undefined;
    creado_por_nombre: string | undefined;
}

export interface ErrorResponse {
    detail: string;
    code: string | undefined;
}

export interface ValidationErrorDetail {
    field: string | undefined;
    message: string;
}

export interface ValidationErrorResponse {
    detail: string | undefined;
    code: string | undefined;
    errors: ValidationErrorDetail[] | undefined;
}
