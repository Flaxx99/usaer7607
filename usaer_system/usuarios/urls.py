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

    # Dashboards por rol
    path('dashboard/secretario/', views.dashboard_secretario, name='dashboard_secretario'),
    path('dashboard/director/', views.dashboard_director, name='dashboard_director'),
    path('dashboard/admin/', views.dashboard_admin, name='dashboard_admin'),
    path('dashboard/maestro-apoyo/', views.dashboard_maestro_apoyo, name='dashboard_maestro_apoyo'),
    path('dashboard/trabajador-social/', views.dashboard_trabajador_social, name='dashboard_trabajador_social'),
    path('dashboard/psicologo/', views.dashboard_psicologo, name='dashboard_psicologo'),
    path('dashboard/psicomotricidad/', views.dashboard_psicomotricidad, name='dashboard_psicomotricidad'),
    path('dashboard/comunicacion/', views.dashboard_comunicacion, name='dashboard_comunicacion'),
    path('dashboard/', dashboard, name='dashboard'),
]
