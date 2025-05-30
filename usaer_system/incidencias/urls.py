from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos

app_name = 'incidencias'

urlpatterns = [
    path('',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.listar_incidencias),name='listar_incidencias'),
    path('crear/',roles_permitidos(['DIRECTOR', 'ADMIN'])(views.crear_incidencia),name='crear_incidencia'),
    path('revisar/',roles_permitidos(['DIRECTOR', 'ADMIN'])(views.revisar_incidencias),name='revisar_incidencias'),
    path('<int:pk>/editar/',roles_permitidos(['DIRECTOR', 'ADMIN'])(views.editar_incidencia),name='editar_incidencia'),
    path('<int:pk>/resolver/',roles_permitidos(['DIRECTOR', 'ADMIN'])(views.resolver_incidencia),name='resolver_incidencia'),
    path('<int:pk>/eliminar/',roles_permitidos(['DIRECTOR', 'ADMIN'])(views.eliminar_incidencia),name='eliminar_incidencia'),
]
