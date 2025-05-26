
from django.urls import path
from . import views

app_name = 'asistencias'

urlpatterns = [
    path('',        views.checar_asistencia, name='checar_asistencia'),
    path('listado/',views.listar_asistencias, name='listar_asistencias'),
]
