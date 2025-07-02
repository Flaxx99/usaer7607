from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

User = get_user_model()

app_name = 'permisos'

# ──────────────────────────────────────────────────────────────
# Roles que pueden solicitar permisos
ROLES_SOLICITANTES = [
    User.Role.MAESTRO_APOYO,
    User.Role.PSICOLOGO,
    User.Role.PSICOMOTRICIDAD,
    User.Role.COMUNICACION,
    User.Role.SECRETARIO,
    User.Role.ADMINISTRADOR,
    User.Role.TRABAJADOR_SOCIAL,
    User.Role.TRABAJADOR_MANUAL,
]

# Roles que solo pueden consultar sus propios permisos
ROLES_SOLO_PERSONALES = ROLES_SOLICITANTES.copy()

# Roles que pueden gestionar todas las solicitudes
ROLES_GESTORES = [
    User.Role.SECRETARIO,
    User.Role.ADMINISTRADOR,
]

# ──────────────────────────────────────────────────────────────
# Rutas de la app permisos

urlpatterns = [
    # Registrar nueva solicitud de permiso
    path(
        'solicitar/',
        roles_permitidos(ROLES_SOLICITANTES)(views.solicitar_permiso),
        name='solicitar'
    ),

    # Ver historial de permisos propios
    path(
        'mis-permisos/',
        roles_permitidos(ROLES_SOLO_PERSONALES)(views.mis_permisos),
        name='mis_permisos'
    ),

    # Vista de administración para gestión completa de solicitudes
    path(
        'gestion/',
        roles_permitidos(ROLES_GESTORES)(views.gestionar_permisos),
        name='gestionar'
    ),

    # Ver detalles de una solicitud
    path(
        '<int:pk>/',
        roles_permitidos(ROLES_GESTORES)(views.detalle_permiso),
        name='detalle'
    ),

    # Aprobar o rechazar solicitud
    path(
        '<int:pk>/responder/',
        roles_permitidos(ROLES_GESTORES)(views.responder_permiso),
        name='responder'
    ),

    # Eliminar una solicitud
    path(
        '<int:pk>/eliminar/',
        roles_permitidos(ROLES_GESTORES)(views.eliminar_permiso),
        name='eliminar'
    ),
]
