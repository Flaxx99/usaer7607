from django.urls import path
from . import views

app_name = 'incidencias'
urlpatterns = [
    path('',               views.listar_incidencias,  name='listar_incidencias'),
    path('nuevo/',         views.crear_incidencia,    name='crear_incidencia'),
    path('revisar/',       views.revisar_incidencias, name='revisar_incidencias'),
    path('<int:pk>/edit/', views.editar_incidencia,   name='editar_incidencia'),
    path('<int:pk>/delete/', views.eliminar_incidencia, name='eliminar_incidencia'),
]
