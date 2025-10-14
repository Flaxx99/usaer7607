from usuarios.admin import admin_site
from django.urls import path, include, re_path
from . import views as core_views
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static
from usuarios.views import CustomLoginView
urlpatterns = [
    
    # Panel de administración de Django
    path('admin/', admin_site.urls),

    # Checador público (entrada/salida) sin login
    path('', core_views.index, name='index'),
    
    path('accounts/login/', CustomLoginView.as_view(), name='login'),

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
    path('oficios/', include('oficios.urls', namespace='oficios')),
    path('rac/', include('rac.urls', namespace='rac')),
    path('calendario/', include('calendario.urls', namespace='calendario')),
    path('avisos/', include('avisos.urls')),
    path('ciclos-escolares/', include('ciclos_escolares.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('notificaciones/', include('notificaciones.urls', namespace='notificaciones')),
    path('rae/', include('rae.urls', namespace='rae')),

]
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
