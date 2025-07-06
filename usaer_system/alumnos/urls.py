from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

User = get_user_model()

app_name = 'alumnos'

urlpatterns = [
    path(
        '',
        roles_permitidos([
            User.Role.MAESTRO_APOYO,
            User.Role.ADMINISTRADOR,
        ])(views.listar_alumnos),
        name='listar_alumnos'
    ),
    path(
        'nuevo/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO,
            User.Role.ADMINISTRADOR,
        ])(views.crear_alumno),
        name='crear_alumno'
    ),
    path(
        '<int:pk>/edit/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO,
            User.Role.ADMINISTRADOR,
        ])(views.editar_alumno),
        name='editar_alumno'
    ),
    path(
        '<int:pk>/delete/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO,
            User.Role.ADMINISTRADOR,
        ])(views.eliminar_alumno),
        name='eliminar_alumno'
    ),
    path(
        'exportar/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO,
            User.Role.ADMINISTRADOR,
        ])(views.exportar_rac),
        name='exportar_rac'
    ),
]
