from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required

User = get_user_model()

app_name = 'permisos'

# ──────────────────────────────────────────────────────────────
urlpatterns = [
    path('', views.permisos_redirect, name='index'),
    # Registrar nueva solicitud de permiso
    path('solicitar/', views.solicitar_permiso, name='solicitar'),
    path('<int:pk>/editar/', views.editar_permiso, name='editar'),

    # Ver historial de permisos propios
    path('mis-permisos/', views.mis_permisos, name='mis_permisos'),

    # Vista de administración para gestión completa de solicitudes
    path('gestion/', views.gestionar_permisos, name='gestionar'),

    # Ver detalles de una solicitud (validación dentro de la vista)
    path('<int:pk>/', views.detalle_permiso, name='detalle'),

    # Aprobar o rechazar solicitud
    path('<int:pk>/responder/', views.responder_permiso, name='responder'),

    # Eliminar una solicitud
    path('<int:pk>/eliminar/', views.eliminar_permiso, name='eliminar'),
]