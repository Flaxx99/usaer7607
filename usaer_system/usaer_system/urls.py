from django.contrib import admin
from django.urls import path, include
from asistencias.views import checar_asistencia

urlpatterns = [
    path('admin/', admin.site.urls),
<<<<<<< HEAD
    
    path('', checar_asistencia, name='index'),
    
    path('asistencias/', include('asistencias.urls', namespace='asistencias')),
    path('permisos/',    include('permisos.urls',    namespace='permisos')),
    path('escuelas/',    include('escuelas.urls',    namespace='escuelas')),
=======

    # Checador público (entrada)
    path('', registrar_entrada, name='index'),

    # Auth (login, logout, password reset…)
    path('accounts/', include('django.contrib.auth.urls')),

    # Apps internas
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    path('usuarios/',    include('usuarios.urls',    namespace='usuarios')),
    path('alumnos/',     include('alumnos.urls',     namespace='alumnos')),
    path('documentos/',  include('documentos.urls',  namespace='documentos')),
    path('asistencias/', include('asistencias.urls', namespace='asistencias')),
    path('permisos/',    include('permisos.urls',    namespace='permisos')),
    path('incidencias/', include('incidencias.urls', namespace='incidencias')),
    path('escuelas/',    include('escuelas.urls',    namespace='escuelas')),
]
