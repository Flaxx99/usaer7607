from django.urls import path
from . import views

app_name = 'asistencias'

urlpatterns = [
    path('entrada/', views.registrar_entrada, name='registrar_entrada'),
    path('salida/', views.registrar_salida, name='registrar_salida'),
    path('lista/', views.listar_asistencias, name='listar_asistencias'),
]
