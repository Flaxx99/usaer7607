from django.urls import path
from . import views

app_name = 'escuelas'

urlpatterns = [
    path('', views.listar_escuelas, name='listar_escuelas'),
    path('crear/', views.crear_escuela, name='crear_escuela'),
    path('editar/<int:pk>/', views.editar_escuela, name='editar_escuela'),
    path('eliminar/<int:pk>/', views.eliminar_escuela, name='eliminar_escuela'),
]
