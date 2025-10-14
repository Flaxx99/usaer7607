from django.urls import path, include
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

User = get_user_model()

app_name = 'alumnos'

urlpatterns = [
    path(
        '',
        roles_permitidos([
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
        ])(views.listar_alumnos),
        name='listar_alumnos'
    ),
    path(
        'nuevo/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
        ])(views.crear_alumno),
        name='crear_alumno'
    ),
    path(
        '<int:pk>/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
        ])(views.detalle_alumno),
        name='detalle_alumno'
    ),
    path(
        '<int:pk>/edit/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
        ])(views.editar_alumno),
        name='editar_alumno'
    ),
    path(
        '<int:pk>/delete/',
        roles_permitidos([
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
        ])(views.eliminar_alumno),
        name='eliminar_alumno'
    ),

    
]
