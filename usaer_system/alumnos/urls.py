from django.urls import path
from . import views

app_name = 'alumnos'
urlpatterns = [
    path('',               views.listar_alumnos, name='listar_alumnos'),
    path('nuevo/',         views.crear_alumno,   name='crear_alumno'),
    path('<int:pk>/edit/', views.editar_alumno, name='editar_alumno'),
    path('<int:pk>/delete/', views.eliminar_alumno, name='eliminar_alumno'),
    path('exportar/',      views.exportar_rac,   name='exportar_rac'),
]
