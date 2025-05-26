"""
URL configuration for usaer_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from asistencias.views import checar_asistencia


urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('', checar_asistencia, name='index'),
    
    path('asistencias/', include('asistencias.urls', namespace='asistencias')),
    path('permisos/',    include('permisos.urls',    namespace='permisos')),
    path('escuelas/',    include('escuelas.urls',    namespace='escuelas')),
    path('usuarios/',    include('usuarios.urls',    namespace='usuarios')),
    path('incidencias/', include('incidencias.urls', namespace='incidencias')),
    path('accounts/',    include('django.contrib.auth.urls')),
    
    # Autenticación (login, logout, password reset)
    path('accounts/',    include('django.contrib.auth.urls')),

    # (Opcional) Página de inicio o dashboard
    # path('', include('home.urls', namespace='home')),


]
