from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos

app_name = 'permisos'

# Todos los roles excepto Trabajador Manual pueden solicitar permisos
solicitantes = [
    'DOCENTE', 'MAESTRO_APOYO',
    'TRAB_SOCIAL', 'PSICOLOGO',
    'PSICOMOTRICIDAD', 'COMUNICACION',
    'SECRETARIO', 'DIRECTOR', 'ADMIN'
]
solo_mis = [
    'DOCENTE', 'MAESTRO_APOYO',
    'TRAB_SOCIAL', 'PSICOLOGO',
    'PSICOMOTRICIDAD', 'COMUNICACION'
]
gestores = ['SECRETARIO', 'DIRECTOR', 'ADMIN']

urlpatterns = [
    # Solicitar permiso
    path('solicitar/', roles_permitidos(solicitantes)(views.solicitar_permiso), name='solicitar'),
    # Ver mis propios permisos
    path('mis-permisos/', roles_permitidos(solo_mis)(views.mis_permisos), name='mis_permisos'),
    # Gestión (listar, filtrar) de todas las solicitudes
    path('gestion/', roles_permitidos(gestores)(views.gestionar_permisos), name='gestionar'),
    # Detalle de una solicitud
    path('<int:pk>/', roles_permitidos(gestores)(views.detalle_permiso), name='detalle'),
    # Aprobar/rechazar
    path('<int:pk>/responder/', roles_permitidos(gestores)(views.responder_permiso), name='responder'),
    # Eliminar solicitud
    path('<int:pk>/eliminar/', roles_permitidos(gestores)(views.eliminar_permiso), name='eliminar'),
]
