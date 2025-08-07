from django.urls import path
from . import views
from .decoradores import roles_permitidos
from .views import dashboard
from django.contrib.auth import get_user_model

User = get_user_model()

app_name = 'usuarios'

urlpatterns = [
    # Listado de usuarios
    path(
        '',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.UserListView.as_view()),
        name='list'
    ),

    # Crear usuario
    path(
        'nuevo/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.UserCreateView.as_view()),
        name='create'
    ),

    # Detalle, editar, eliminar
        path('<int:pk>/detail/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.UserDetailView.as_view()),
        name='detail'
    ),
    path('<int:pk>/editar/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.UserUpdateView.as_view()),
        name='update'
    ),
    path(
        '<int:pk>/eliminar/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.UserDeleteView.as_view()),
        name='delete'
    ),
    path(
        '<int:pk>/toggle-active/',
        roles_permitidos([
            User.Role.ADMINISTRADOR,
            User.Role.SECRETARIO,
        ])(views.toggle_user_active),
        name='toggle_active'
    ),

    # Perfil y contraseña
    path('perfil/', views.profile, name='profile'),
    path('cambiar-contrasena/', views.change_password, name='change_password'),

    # Redirección post-login
    path('redireccion/', views.redireccion_post_login, name='redireccion_post_login'),

    path('dashboard/', dashboard, name='dashboard'),
]
