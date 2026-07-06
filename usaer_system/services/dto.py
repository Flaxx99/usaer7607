"""
DTOs (Data Transfer Objects) tipados con pydantic para la capa de servicios.

Centraliza los contratos de datos entre services y views, reemplazando
dataclasses simples y dicts sueltos con modelos que validan y serializan.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

# ─── Service DTOs ────────────────────────────────────────────────────────────


class AvisoDTO(BaseModel):
    """DTO para avisos del dashboard."""

    id: int
    titulo: str
    contenido: str
    autor: str
    fecha: datetime


class StatsDTO(BaseModel):
    """DTO para estadísticas globales del dashboard."""

    total_alumnos: int = 0
    total_escuelas: int = 0
    total_usuarios: int = 0
    total_maestros: int = 0


class GraficaEscuelaEntry(BaseModel):
    """Entrada individual de la gráfica de escuelas."""

    escuela__nombre: str = ""
    total: int = 0


class ChartEntry(BaseModel):
    """Entrada individual de la gráfica de clasificación."""

    clasificacion: str = ""
    total: int = 0


class ActividadRecienteDTO(BaseModel):
    """DTO para actividad reciente en el dashboard."""

    tipo: str  # "RAC", "RAE", "ASISTENCIA"
    descripcion: str
    fecha: datetime
    url: str = ""


class RAEDashboardProgress(BaseModel):
    """Progreso de captura RAE agregado — resumen general."""

    total_escuelas: int = 0
    completadas: int = 0
    porcentaje_general: float = 0.0
    detalle_escuelas: list[RAEProgressItem] = Field(default_factory=list)


class AsistenciaTrendEntry(BaseModel):
    """Entrada diaria de tendencia de asistencias."""

    fecha: str
    presentes: int = 0
    total: int = 0
    porcentaje: float = 0.0


class EscuelaFilterOption(BaseModel):
    """Opción de escuela para el filtro del dashboard."""

    id: int
    nombre: str


class DashboardData(BaseModel):
    """DTO principal del dashboard.

    Reemplaza el dataclass anterior — usa model_dump() para serializar.
    """

    ciclo_actual: str = "Sin Ciclo Activo"
    ultimos_avisos: list[AvisoDTO] = Field(default_factory=list)
    permisos_pendientes: int = 0
    incidencias_pendientes: int = 0
    stats: StatsDTO = Field(default_factory=StatsDTO)
    grafica_clasificacion: list[ChartEntry] = Field(default_factory=list)
    grafica_escuelas: list[GraficaEscuelaEntry] = Field(default_factory=list)
    racs_pendientes: int = 0
    actividad_reciente: list[ActividadRecienteDTO] = Field(default_factory=list)
    eventos_hoy: list[dict] = Field(default_factory=list)
    rae_progress: RAEDashboardProgress = Field(default_factory=RAEDashboardProgress)
    asistencia_trend: list[AsistenciaTrendEntry] = Field(default_factory=list)
    escuelas_filtro: list[EscuelaFilterOption] = Field(default_factory=list)


# ─── Payload Validation Schemas ──────────────────────────────────────────────
# Para endpoints donde NO hay DRF serializer (custom actions, APIViews).


class ResponderPermisoPayload(BaseModel):
    """Payload para aprobar/rechazar un permiso."""

    estado: Literal["APROBADO", "RECHAZADO"]
    respuesta_admin: str = ""

    @model_validator(mode="after")
    def validar_rechazo(self) -> ResponderPermisoPayload:
        if self.estado == "RECHAZADO" and not self.respuesta_admin:
            raise ValueError("Debe justificar el rechazo.")
        return self


class ResolverIncidenciaPayload(BaseModel):
    """Payload para resolver una incidencia."""

    respuesta_admin: str = Field(..., min_length=1)


class PromoverPayload(BaseModel):
    """Payload para ejecutar promoción de alumnos."""

    confirmed: bool = False


class FiltrosUsuario(BaseModel):
    """Query params para filtrar listado de usuarios."""

    role: str | None = None
    escuela: str | None = None
    activo: str | None = None


class ToggleCerradoPayload(BaseModel):
    """Payload para cerrar/reabrir un registro RAE."""

    cerrado: bool


class AlumnoIdQuery(BaseModel):
    """Query param para buscar RAC por alumno."""

    alumno_id: int


# ─── Tipos Literal ────────────────────────────────────────────────────────────


PermisoTipo = Literal[
    "PERSONAL",
    "ENFERMEDAD",
    "COMISION",
    "LLEGADA_TARDE",
    "SALIDA_TEMPRANA",
]
"""Valores posibles para el campo tipo de un permiso."""


PermisoEstado = Literal["PENDIENTE", "APROBADO", "RECHAZADO"]
"""Valores posibles para el campo estado de un permiso."""


# ─── Response Models ─────────────────────────────────────────────────────────
# Para endpoints que NO usan DRF serializers y devuelven dicts crudos.


class StatusDetailResponse(BaseModel):
    """Respuesta simple con estado y detalle."""

    status: str = "success"
    detail: str = ""


class UnreadCountResponse(BaseModel):
    """Respuesta del conteo de notificaciones no leídas."""

    unread_count: int


class ToggleActiveResponse(BaseModel):
    """Respuesta de activar/desactivar usuario."""

    status: str
    activo: bool


class MetricasPermisoResponse(BaseModel):
    """Métricas de permisos para el dashboard."""

    total: int = 0
    pendientes: int = 0
    aprobados: int = 0
    rechazados: int = 0
    ultima_semana: int = 0


class PermisoResponse(BaseModel):
    """DTO que refleja la salida del PermisoSerializer.

    Coincide campo a campo con lo que devuelve el DRF ModelSerializer,
    incluyendo los ReadOnlyFields computados (profesor_nombre, etc.)
    y los formatos de fecha/hora.
    """

    id: int
    tipo: PermisoTipo
    fecha_inicio: str
    fecha_fin: str
    horas_solicitadas: str | None = None
    motivo: str
    estado: PermisoEstado
    respuesta_admin: str | None = None
    profesor: int
    profesor_nombre: str
    escuela: int
    escuela_nombre: str
    administrador_nombre: str | None = None
    fecha_solicitud: str
    fecha_respuesta: str | None = None
    duracion_dias: int


IncidenciaEstado = Literal["PENDIENTE", "RESUELTA"]
"""Valores posibles para el campo estado de una incidencia."""


class IncidenciaResponse(BaseModel):
    """DTO que refleja la salida del IncidenciaSerializer.

    Incluye los ReadOnlyFields computados (escuela_nombre,
    profesor_nombre, reportado_por_nombre) y los formatos de fecha.
    """

    id: int
    titulo: str
    descripcion: str
    escuela: int
    escuela_nombre: str
    profesor: int
    profesor_nombre: str
    reportado_por: int
    reportado_por_nombre: str
    estado: IncidenciaEstado
    respuesta_admin: str | None = None
    fecha_reporte: str
    fecha_resolucion: str | None = None


class AnuncioResponse(BaseModel):
    """DTO que refleja la salida del AnuncioSerializer.

    Incluye los ReadOnlyFields (autor_nombre, es_activo).
    """

    id: int
    titulo: str
    contenido: str
    fecha_publicacion: str
    fecha_expiracion: str | None = None
    autor: int
    autor_nombre: str
    es_activo: bool


class LoginResponse(BaseModel):
    """Respuesta de login exitoso con token y datos del usuario."""

    detail: str = "Login exitoso"
    token: str
    user: dict[str, Any]


class CicloEscolarResponse(BaseModel):
    """DTO que refleja la salida del CicloEscolarSerializer (fields='__all__')."""

    id: int
    nombre: str
    fecha_inicio: str
    fecha_fin: str
    activo: bool


EscuelaNivel = Literal["PREESCOLAR", "PRIMARIA", "SECUNDARIA"]


class EscuelaSimpleResponse(BaseModel):
    """DTO ligero para nested object escuela_detalle (EscuelaSimpleSerializer).

    Coincide con EscuelaSimpleSerializer: id, nombre, clave_estatal, nivel, zona.
    """

    id: int
    nombre: str
    clave_estatal: str
    nivel: str
    zona: str


class EscuelaResponse(BaseModel):
    """DTO que refleja la salida del EscuelaSerializer (fields='__all__').

    Incluye todos los campos del modelo, incluyendo director (FK).
    """

    id: int
    clave_estatal: str
    cct: str
    nombre: str
    nivel: EscuelaNivel
    domicilio: str
    colonia: str
    telefono: str | None = None
    zona: str
    inspector: str = ""
    telefono_inspector: str = ""
    correo_inspector: str = ""
    director: int | None = None
    celular_director: str = ""
    correo_director: str = ""


class NotificacionResponse(BaseModel):
    """DTO que refleja la salida del NotificacionSerializer.

    El modelo usa 'mensaje' (no titulo/contenido) y 'leida'.
    """

    id: int
    mensaje: str
    leida: bool
    fecha_creacion: str
    url: str | None = None


class OficioResponse(BaseModel):
    """DTO que refleja la salida del OficioSerializer.

    Incluye el ReadOnlyField subido_por_nombre.
    """

    id: int
    titulo: str
    descripcion: str
    archivo: str
    fecha_subida: str
    subido_por: int
    subido_por_nombre: str


class AsistenciaResponse(BaseModel):
    """DTO que refleja la salida del AsistenciaSerializer.

    Incluye los ReadOnlyFields (profesor_nombre, escuela_nombre)
    y formatos de hora.
    """

    id: int
    profesor: int
    profesor_nombre: str
    escuela: int
    escuela_nombre: str
    fecha: str
    presente: bool
    hora_entrada: str | None = None
    hora_salida: str | None = None


class AlumnoResponse(BaseModel):
    """DTO que refleja la salida del AlumnoSerializer.

    Incluye nested object escuela_detalle (EscuelaSimpleSerializer).
    """

    id: int
    profesor: int | None = None
    profesor_nombre: str
    escuela: int
    escuela_detalle: EscuelaSimpleResponse | None = None
    escuela_nombre: str
    apellido_paterno: str
    apellido_materno: str = ""
    nombres: str
    nombre_completo: str
    curp: str
    fecha_nacimiento: str | None = None
    sexo: str
    edad: int | None = None
    grado: str
    grupo: str = ""
    activo: bool = True
    clasificacion: str
    clasificacion_otro: str = ""


class UsuarioResponse(BaseModel):
    """DTO que refleja la salida del UserSerializer (completo).

    Incluye nested object escuela_detalle (EscuelaSimpleSerializer).
    """

    id: int
    email: str
    numero_empleado: str = ""
    role: str
    nombre: str = ""
    apellido_paterno: str = ""
    apellido_materno: str = ""
    nombre_completo: str = ""
    escuela: int | None = None
    escuela_detalle: EscuelaSimpleResponse | None = None
    telefono: str = ""
    celular: str = ""
    domicilio: str = ""
    rfc: str = ""
    curp: str = ""
    nivel: str = ""
    grado: str = ""
    situacion: str = ""
    fecha_ingreso: str | None = None
    antiguedad: str = ""
    activo: bool = True
    is_superuser: bool = False


class PromocionExecResponse(BaseModel):
    """Respuesta de una promoción ejecutada."""

    status: str = "success"
    detail: str = ""
    promovidos: int = 0
    graduados: int = 0


class AlumnoPromoverResponse(BaseModel):
    """Respuesta de simulación (GET) de promover alumnos."""

    simulation: bool
    ciclo_actual: str = ""
    total_pendientes: int = 0
    a_promover: int = 0
    a_graduar: int = 0
    omitidos: int = 0
    promovidos: list[dict[str, Any]] = Field(default_factory=list)
    graduados: list[dict[str, Any]] = Field(default_factory=list)
    omitidos_detalle: list[dict[str, Any]] = Field(default_factory=list)


class AlumnoPromoverCommitResponse(BaseModel):
    """Respuesta de ejecución (POST) de promover alumnos."""

    simulation: Literal[False] = False
    ciclo_promocion: str = ""
    promovidos_count: int = 0
    graduados_count: int = 0
    errores: list[str] = Field(default_factory=list)
    detail: str = ""


class PromocionPreviewResponse(BaseModel):
    """Respuesta de preview (simulación) de promoción de ciclo."""

    total_activos: int = 0
    a_promover_count: int = 0
    a_graduar_count: int = 0
    errores_count: int = 0
    detalles_promover: list[str] = Field(default_factory=list)
    detalles_graduar: list[str] = Field(default_factory=list)
    detalles_errores: list[str] = Field(default_factory=list)


class CerrarRegistroResponse(BaseModel):
    """Respuesta de cerrar/reabrir un registro RAE."""

    detail: str
    registro_id: int
    cerrado: bool


class RACPendientesResponse(BaseModel):
    """Respuesta del endpoint /rac/pendientes/ (conteo de alumnos sin RAC)."""

    total_pendientes: int
    ciclo: str


class ChecadorResponse(BaseModel):
    """Respuesta de registro de entrada/salida (kiosco/checador).

    Usado por asistencias/views.py en los endpoints público y privado.
    - ENTRADA: message, tipo='ENTRADA', profesor, hora
    - SALIDA: message, detalle, tipo='SALIDA', profesor, hora
    """

    message: str
    tipo: Literal["ENTRADA", "SALIDA"]
    profesor: str
    hora: str
    detalle: str | None = None


# ─── RAE DTOs ──────────────────────────────────────────────────────────────


class RAEAlumnoResponse(BaseModel):
    """DTO que refleja la salida del RAEAlumnoSerializer (fields='__all__')."""

    id: int
    registro: int
    alumno: int
    capturado_por: int | None = None
    curp: str | None = None
    genero: str | None = None
    edad: int | None = None
    grado: str | None = None

    # Condición del alumno (discapacidades)
    ceg: bool = False
    bv: bool = False
    so: bool = False
    hp: bool = False
    scg: bool = False
    dmo: bool = False
    di: bool = False
    dme: bool = False
    psicosocial: bool = False
    dm: bool = False
    dsc: bool = False
    dsco: bool = False
    dsa: bool = False
    tda: bool = False
    tea: bool = False

    # Aptitudes sobresalientes
    asi: bool = False
    asc: bool = False
    asa: bool = False
    asp: bool = False
    ass: bool = False
    ot: bool = False

    # Apoyo específico
    psicologia: bool = False
    comunicacion: bool = False
    psicomotricidad: bool = False
    trabajo_social: bool = False
    aprendizaje: bool = False

    # Tipo de atención
    nuevo_ingreso: bool = False
    subsecuente: bool = False

    # Portafolio
    diagnostico: bool = False
    educativo: bool = False
    deteccion: bool = False
    psicopedagogico: bool = False
    plan: bool = False
    modelo: bool = False

    # ReadOnly del serializer
    alumno_nombre: str | None = None


class RegistroRAEResponse(BaseModel):
    """DTO que refleja la salida del RegistroRAESerializer (fields='__all__')."""

    id: int
    escuela: int
    ciclo_escolar: int
    creado_por: int | None = None
    fecha_creacion: datetime
    cerrado: bool = False
    docente_hombres: int = 0
    docente_mujeres: int = 0

    # ReadOnly del serializer
    escuela_nombre: str | None = None
    ciclo_nombre: str | None = None
    creado_por_nombre: str | None = None


class RAEInitResponse(BaseModel):
    """Respuesta del endpoint /rae/captura/ (inicializar captura RAE)."""

    registro_id: int
    version: int
    ciclo: str
    escuela: str
    cerrado: bool
    alumnos: list[RAEAlumnoResponse]


class RAEProgressItem(BaseModel):
    """Respuesta del endpoint /rae/progreso/ (progreso por escuela)."""

    escuela_id: int
    escuela_nombre: str
    escuela_cct: str
    registro_id: int
    total_alumnos: int
    completados: int
    porcentaje: float
    cerrado: bool


# ─── RAC DTOs ───────────────────────────────────────────────────────────────


class RegistroRACResponse(BaseModel):
    """DTO que refleja la salida del RegistroRACSerializer (fields='__all__')."""

    id: int
    alumno: int
    ciclo_escolar: int
    escuela_regular: int
    zona_regular: str | None = None
    curp: str | None = None
    sexo: str | None = None
    edad: int | None = None
    grado: str | None = None
    service_type: str = "USAER"
    sup_especial_cct: str | None = None
    sup_especial_zona: str | None = None
    centro_cct: str | None = None
    centro_nombre: str | None = None
    maestro_apoyo: int
    escuela_basica: int
    clasificacion: str
    subclasificacion: str
    observaciones: str = ""
    fecha_registro: str | None = None

    # ReadOnly del serializer
    alumno_nombre: str | None = None
    escuela_nombre: str | None = None
    maestro_nombre: str | None = None
    service_type_display: str | None = None


# ─── Documentos DTOs ────────────────────────────────────────────────────────


class OtroArchivoResponse(BaseModel):
    """DTO que refleja la salida del OtroArchivoSerializer.

    Son los archivos extra anidados dentro de ExpedienteResponse.
    """

    id: int
    archivo: str
    descripcion: str
    url_archivo: str | None = None
    nombre_archivo: str | None = None


class ExpedienteResponse(BaseModel):
    """DTO que refleja la salida del ExpedienteSerializer (fields='__all__').

    Solo modela la respuesta GET. Los campos FileField aparecen como
    strings (URLs del archivo). El tipo híbrido para formulario se define
    en el frontend extendiendo esta interfaz.
    """

    id: int
    alumno: int
    profesor: int | None = None
    informe_deteccion: str | None = None
    informe_psicopedagogico: str | None = None
    plan_intervencion: str | None = None
    observaciones: str = ""
    fecha_subida: str | None = None

    # ReadOnly del serializer
    alumno_nombre: str | None = None
    profesor_nombre: str | None = None

    # Nested
    otros_archivos: list[OtroArchivoResponse] = Field(default_factory=list)


# ─── Calendario DTOs ─────────────────────────────────────────────────────────


CalendarEventType = Literal["EVALUACION", "REUNION", "VISITA", "TAREA", "OTRO"]
"""Valores posibles para el campo event_type de un evento de calendario."""

CalendarStatus = Literal["PENDIENTE", "COMPLETADO", "CANCELADO"]
"""Valores posibles para el campo status de un evento de calendario."""

CalendarPriority = Literal["BAJA", "MEDIA", "ALTA"]
"""Valores posibles para el campo priority de un evento de calendario."""


class EventoCalendarioResponse(BaseModel):
    """DTO que refleja la salida del EventoCalendarioSerializer.

    Usa nombres en inglés para coincidir con la interfaz CalendarEvent del frontend.
    """

    id: int
    title: str
    description: str
    start_time: str
    end_time: str
    event_type: CalendarEventType = "OTRO"
    status: CalendarStatus = "PENDIENTE"
    priority: CalendarPriority = "MEDIA"
    color: str = "#3B82F6"
    created_by: int
    created_by_nombre: str | None = None
    assigned_to: int | None = None
    assigned_to_nombre: str | None = None
    alumno: int | None = None
    alumno_nombre: str | None = None
    escuela: int | None = None
    escuela_nombre: str | None = None

    # Legacy (backward compat)
    start: str | None = None
    end: str | None = None
