from usuarios.admin import admin_site
from django.urls import path, include
from . import views as core_views
from django.contrib.auth import views as auth_views


urlpatterns = [
    # Panel de administración de Django
    path('admin/', admin_site.urls),

    # Checador público (entrada/salida) sin login
    path('', core_views.index, name='index'),
    
    path('accounts/login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),

    # Autenticación (login, logout, password reset…)
    path('accounts/', include('django.contrib.auth.urls')),

    # Módulos de la aplicación
    path('usuarios/',    include('usuarios.urls',    namespace='usuarios')),
    path('alumnos/',     include('alumnos.urls',     namespace='alumnos')),
    path('documentos/',  include('documentos.urls',  namespace='documentos')),
    path('asistencias/', include('asistencias.urls', namespace='asistencias')),
    path('permisos/',    include('permisos.urls',    namespace='permisos')),
    path('incidencias/', include('incidencias.urls', namespace='incidencias')),
    path('escuelas/',    include('escuelas.urls',    namespace='escuelas')),
]
