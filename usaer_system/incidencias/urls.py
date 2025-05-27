# incidencias/urls.py

from django.urls import path
from . import views

app_name = 'incidencias'

urlpatterns = [
    # Para que un Profesor vea sus propias incidencias
    path('', views.listar_incidencias, name='listar_incidencias'),
    # Para que el Director cree/acuse nuevas incidencias
    path('crear/', views.crear_incidencia, name='crear_incidencia'),
    # Panel del Director para revisar todas las incidencias de su escuela
    path('revisar/', views.revisar_incidencias, name='revisar_incidencias'),
    # Edición/actualización de una incidencia existente
    path('<int:pk>/editar/', views.editar_incidencia, name='editar_incidencia'),
    # Vista dedicada para marcar una incidencia como resuelta
    path('<int:pk>/resolver/', views.resolver_incidencia, name='resolver_incidencia'),
    # Eliminación de una incidencia (sólo Director/Staff)
    path('<int:pk>/eliminar/', views.eliminar_incidencia, name='eliminar_incidencia'),
]
