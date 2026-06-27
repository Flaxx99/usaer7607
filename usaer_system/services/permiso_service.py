"""
permiso_service.py — Lógica de negocio para gestión de permisos.

Extraída de permisos/views.py:responder para centralizar validaciones
y facilitar tests.
"""

from __future__ import annotations

from django.utils import timezone

from services.dto import ResponderPermisoPayload


def responder_permiso(permiso, payload: ResponderPermisoPayload, user) -> None:
    """Ejecuta la respuesta a un permiso: aprueba o rechaza.

    Args:
        permiso: instancia del modelo Permiso
        payload: validado por pydantic (ResponderPermisoPayload)
        user: usuario que responde (request.user)

    Raises:
        ValueError: si el permiso ya fue gestionado (no está pendiente)
        PermissionError: si el usuario no tiene autoridad (Admin/Director)
    """
    # Idempotencia: solo responder si está PENDIENTE
    if permiso.estado != permiso.Estado.PENDIENTE:
        raise ValueError(
            f"Este permiso ya ha sido gestionado y se encuentra en estado "
            f"{permiso.get_estado_display()}. No se puede modificar."
        )

    # Autorización: solo Admin o Director
    # NOTA: User.Role.ADMINISTRADOR.value = "ADMIN"
    roles_autoridad = ["ADMIN", "DIRECTOR"]
    if getattr(user, "role", "") not in roles_autoridad and not getattr(
        user, "is_superuser", False
    ):
        raise PermissionError("No tienes permiso para responder.")

    # Ejecutar
    permiso.estado = payload.estado
    permiso.respuesta_admin = payload.respuesta_admin.upper()
    permiso.administrador = user
    permiso.fecha_respuesta = timezone.now()
    permiso.save()
