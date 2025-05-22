from django.urls import path
from . import views

app_name = 'incidencias'

urlpatterns = [
    # Profesor
    path('reportar/',  views.crear_incidencia,  name='crear_incidencia'),
    path('mis-incidencias/', views.listar_incidencias, name='listar_incidencias'),

    # Administrador / Director
    path('revisar/',   views.revisar_incidencias, name='revisar_incidencias'),
    path('editar/<int:pk>/', views.editar_incidencia, name='editar_incidencia'),
    path('eliminar/<int:pk>/', views.eliminar_incidencia, name='eliminar_incidencia'),
]
