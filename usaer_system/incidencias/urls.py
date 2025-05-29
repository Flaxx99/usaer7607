from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos

app_name = 'incidencias'

urlpatterns = [
    # Listado de incidencias: Profesores de campo, maestras de apoyo y Admin
    path('', roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.listar_incidencias), name='listar_incidencias'),
    # Crear incidencia: Director y Admin
    path('crear/', roles_permitidos(['DIRECTOR', 'ADMIN'])(views.crear_incidencia), name='crear_incidencia'),
    # Revisar todas las incidencias: Director y Admin
    path('revisar/', roles_permitidos(['DIRECTOR', 'ADMIN'])(views.revisar_incidencias), name='revisar_incidencias'),
    # Editar una incidencia existente: Director y Admin
    path('<int:pk>/editar/', roles_permitidos(['DIRECTOR', 'ADMIN'])(views.editar_incidencia), name='editar_incidencia'),
    # Marcar incidencia como resuelta: Director y Admin
    path('<int:pk>/resolver/', roles_permitidos(['DIRECTOR', 'ADMIN'])(views.resolver_incidencia), name='resolver_incidencia'),
    # Eliminar incidencia: Director y Admin
    path('<int:pk>/eliminar/', roles_permitidos(['DIRECTOR', 'ADMIN'])(views.eliminar_incidencia), name='eliminar_incidencia'),
]
