
from django.urls import path, include
from . import views

app_name = 'asistencias'
urlpatterns = [
    path('checador/', views.mostrar_checador, name='mostrar_checador'),
    path('',        views.checar_asistencia, name='checar_asistencia'),
    path('listado/',views.listar_asistencias, name='listar_asistencias'),
]
