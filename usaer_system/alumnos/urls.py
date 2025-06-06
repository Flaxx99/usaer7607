from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos

app_name = 'alumnos'

urlpatterns = [
    path('',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.listar_alumnos),name='listar_alumnos'),
    path('nuevo/',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.crear_alumno),name='crear_alumno'),
    path('<int:pk>/edit/',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.editar_alumno),name='editar_alumno'),
    path('<int:pk>/delete/',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.eliminar_alumno),name='eliminar_alumno'),
    path('exportar/',roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])(views.exportar_rac),name='exportar_rac'),
]
