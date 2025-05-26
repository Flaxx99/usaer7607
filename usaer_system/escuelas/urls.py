from django.urls import path
from . import views

app_name = 'escuelas'
urlpatterns = [
    path('',               views.listar_escuelas,  name='listar_escuelas'),
    path('nuevo/',         views.crear_escuela,    name='crear_escuela'),
    path('<int:pk>/edit/', views.editar_escuela,   name='editar_escuela'),
    path('<int:pk>/delete/', views.eliminar_escuela, name='eliminar_escuela'),
]
