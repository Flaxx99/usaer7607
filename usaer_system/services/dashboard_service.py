"""
Dashboard service — funciones independientes y tipadas para armar el
dashboard principal. Cada función maneja sus propios errores y devuelve
un valor seguro (nunca lanza). El DashboardView las coordina.
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import models
from django.db.models import Count, Q

from .dto import AvisoDTO, DashboardData, StatsDTO

logger = logging.getLogger(__name__)


# ─── Servicios ───────────────────────────────────────────────────────────────


def get_ciclo_actual() -> str:
    """Devuelve el nombre del ciclo escolar activo, o un mensaje por defecto."""
    from ciclos_escolares.models import CicloEscolar

    try:
        ciclo = CicloEscolar.objects.filter(activo=True).first()
        return ciclo.nombre if ciclo else "Sin Ciclo Activo"
    except Exception:
        logger.exception("Error obteniendo ciclo actual")
        return "Sin Ciclo Activo"


def get_permisos_pendientes(user) -> int:
    """Cuenta permisos pendientes según el rol del usuario."""
    from permisos.models import Permiso

    try:
        qs = Permiso.objects.pendientes()
        es_admin = user.role in ("ADMIN", "ADMINISTRADOR") or user.is_superuser
        es_director = user.role == "DIRECTOR"

        if not es_admin:
            if es_director and user.escuela_id:
                qs = qs.filter(escuela=user.escuela)
            elif not es_director:
                qs = qs.filter(profesor=user)
            else:
                qs = qs.none()
        return qs.count()
    except Exception:
        logger.exception("Error contando permisos pendientes")
        return 0


def get_incidencias_pendientes(user) -> int:
    """Cuenta incidencias pendientes según el rol del usuario."""
    from incidencias.models import Incidencia

    try:
        qs = Incidencia.objects.pendientes()
        es_admin = user.role in ("ADMIN", "ADMINISTRADOR") or user.is_superuser
        es_director = user.role == "DIRECTOR"
        es_secretario = user.role == "SECRETARIO"

        if not es_admin:
            if (es_director or es_secretario) and user.escuela_id:
                qs = qs.filter(escuela=user.escuela)
            elif not es_director and not es_secretario:
                # Maestros y roles de equipo: ven donde son reportado_por o profesor
                qs = qs.filter(models.Q(reportado_por=user) | models.Q(profesor=user))
            else:
                qs = qs.none()
        return qs.count()
    except Exception:
        logger.exception("Error contando incidencias pendientes")
        return 0


def get_ultimos_avisos() -> list[AvisoDTO]:
    """Últimos 5 avisos activos con autor."""
    from avisos.models import Anuncio

    try:
        avisos = (
            Anuncio.objects.vigentes().select_related("autor").order_by("-fecha_publicacion")[:5]
        )
        return [
            AvisoDTO(
                id=a.id,
                titulo=a.titulo,
                contenido=a.contenido,
                autor=a.autor.get_full_name()
                if hasattr(a.autor, "get_full_name")
                else str(a.autor),
                fecha=a.fecha_publicacion,
            )
            for a in avisos
        ]
    except Exception:
        logger.exception("Error cargando avisos")
        return []


def get_stats() -> StatsDTO:
    """Estadísticas globales: alumnos, escuelas, usuarios, maestros."""
    from alumnos.models import Alumno
    from django.contrib.auth import get_user_model
    from escuelas.models import Escuela

    user_model = get_user_model()

    try:
        stats_alumnos = Alumno.objects.activos().aggregate(
            total_alumnos=Count("id"),
        )
        total_escuelas = Escuela.objects.count()
        stats_usuarios = user_model.objects.filter(activo=True).aggregate(
            total_usuarios=Count("id"),
            total_maestros=Count("id", filter=Q(role="MAESTRO_APOYO")),
        )
        return StatsDTO(
            total_alumnos=stats_alumnos["total_alumnos"] or 0,
            total_escuelas=total_escuelas,
            total_usuarios=stats_usuarios["total_usuarios"] or 0,
            total_maestros=stats_usuarios["total_maestros"] or 0,
        )
    except Exception:
        logger.exception("Error calculando stats")
        return StatsDTO()


def get_graficas() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Datos para gráficas: clasificación de alumnos y top escuelas."""
    from alumnos.models import Alumno

    try:
        clasificacion = list(
            Alumno.objects.activos()
            .values("clasificacion")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        escuelas = list(
            Alumno.objects.activos()
            .values("escuela__nombre")
            .annotate(total=Count("id"))
            .order_by("-total")[:5]
        )
        return clasificacion, escuelas
    except Exception:
        logger.exception("Error generando datos de gráficas")
        return [], []


def build_dashboard_data(user) -> DashboardData:
    """Arma el DashboardData completo. Cada sub-función es independiente."""
    data = DashboardData(
        ciclo_actual=get_ciclo_actual(),
        ultimos_avisos=get_ultimos_avisos(),
        permisos_pendientes=get_permisos_pendientes(user),
        incidencias_pendientes=get_incidencias_pendientes(user),
        stats=get_stats(),
    )
    data.grafica_clasificacion, data.grafica_escuelas = get_graficas()
    return data
