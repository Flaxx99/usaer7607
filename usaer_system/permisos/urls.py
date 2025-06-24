from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model
User = get_user_model()

app_name = 'permisos'

# Todos los roles excepto Trabajador Manual pueden solicitar permisos
solicitantes = [
    'MAESTRO_APOYO',
    'TRAB_SOCIAL', 'PSICOLOGO',
    'PSICOMOTRICIDAD', 'COMUNICACION',
    'SECRETARIO', 'ADMIN', 'TRAB_MANUAL'
]
solo_mis = [
    'MAESTRO_APOYO',
    'TRAB_SOCIAL', 'PSICOLOGO',
    'PSICOMOTRICIDAD', 'COMUNICACION',
    'TRAB_MANUAL'
]
gestores = ['SECRETARIO', 'ADMIN']

urlpatterns = [
    # Solicitar permiso
    path('solicitar/', roles_permitidos(solicitantes)(views.solicitar_permiso), name='solicitar'),
    # Ver mis propios permisos
    path('mis-permisos/', roles_permitidos(solo_mis + [User.Role.MAESTRO_APOYO])(views.mis_permisos), name='mis_permisos'),
    # Gestión (listar, filtrar) de todas las solicitudes
    path('gestion/', roles_permitidos(gestores)(views.gestionar_permisos), name='gestionar'),
    # Detalle de una solicitud
    path('<int:pk>/', roles_permitidos(gestores)(views.detalle_permiso), name='detalle'),
    # Aprobar/rechazar
    path('<int:pk>/responder/', roles_permitidos(gestores)(views.responder_permiso), name='responder'),
    # Eliminar solicitud
    path('<int:pk>/eliminar/', roles_permitidos(gestores)(views.eliminar_permiso), name='eliminar'),
]
