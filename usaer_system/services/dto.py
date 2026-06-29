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
