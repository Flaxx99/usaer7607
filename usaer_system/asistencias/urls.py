
from django.urls import path
from . import views

app_name = 'asistencias'
urlpatterns = [
<<<<<<< HEAD
    path('',        views.checar_asistencia, name='checar_asistencia'),
    path('listado/',views.listar_asistencias, name='listar_asistencias'),
=======
    path('entrada/', views.registrar_entrada, name='registrar_entrada'),
    path('salida/',  views.registrar_salida,  name='registrar_salida'),
    path('listado/', views.listar_asistencias,name='listar_asistencias'),
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
]
