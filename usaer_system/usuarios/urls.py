from django.urls import path
from . import views
from .decoradores import roles_permitidos
from .views import dashboard

app_name = 'usuarios'

urlpatterns = [
    # Listado de usuarios
    path('', roles_permitidos(['ADMIN', 'SECRETARIO'])(views.UserListView.as_view()), name='list'),

    # Crear usuario
    path('nuevo/', roles_permitidos(['ADMIN'])(views.UserCreateView.as_view()), name='create'),

    # Detalle, editar, eliminar
    path('<int:pk>/', views.UserDetailView.as_view(), name='detail'),
    path('<int:pk>/editar/', views.UserUpdateView.as_view(), name='update'),
    path('<int:pk>/eliminar/', roles_permitidos(['ADMIN'])(views.UserDeleteView.as_view()), name='delete'),
    path('<int:pk>/toggle-active/', roles_permitidos(['ADMIN'])(views.toggle_user_active), name='toggle_active'),

    # Perfil y contraseña
    path('perfil/', views.profile, name='profile'),
    path('cambiar-contrasena/', views.change_password, name='change_password'),

    # Redirección post-login
    path('redireccion/', views.redireccion_post_login, name='redireccion_post_login'),

    path('dashboard/', dashboard, name='dashboard'),
]
