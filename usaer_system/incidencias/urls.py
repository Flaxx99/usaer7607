from django.urls import path
from . import views
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

User = get_user_model()

app_name = 'incidencias'

urlpatterns = [
    path(
        '',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.DIRECTOR,
        ])(views.listar_incidencias),
        name='listar_incidencias'
    ),
    path(
        'crear/',
        roles_permitidos([
            User.Role.SECRETARIO,
            User.Role.ADMINISTRADOR,
            User.Role.DIRECTOR,
        ])(views.crear_incidencia),
        name='crear_incidencia'
    ),
    path(
        'revisar/',
        roles_permitidos([
            User.Role.DIRECTOR,
            User.Role.ADMINISTRADOR,
        ])(views.revisar_incidencias),
        name='revisar_incidencias'
    ),
    path(
        '<int:pk>/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.DIRECTOR,
            User.Role.MAESTRO_APOYO,
        ])(views.detalle_incidencia),
        name='detalle_incidencia'
    ),
    path(
        '<int:pk>/editar/',
        roles_permitidos([
            User.Role.DIRECTOR,
            User.Role.ADMINISTRADOR,
        ])(views.editar_incidencia),
        name='editar_incidencia'
    ),
    path(
        '<int:pk>/resolver/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
        ])(views.resolver_incidencia),
        name='resolver_incidencia'
    ),
    path(
        '<int:pk>/eliminar/',
        roles_permitidos([
            User.Role.DIRECTOR,
            User.Role.ADMINISTRADOR,
        ])(views.eliminar_incidencia),
        name='eliminar_incidencia'
    ),
]
