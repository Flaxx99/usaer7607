from django.urls import path
from . import views

app_name = 'ciclos_escolares'

urlpatterns = [
    path('', views.lista_ciclos, name='lista_ciclos'),
    path('nuevo/', views.crear_ciclo, name='crear_ciclo'),
    path('editar/<int:pk>/', views.editar_ciclo, name='editar_ciclo'),
    path('eliminar/<int:pk>/', views.eliminar_ciclo, name='eliminar_ciclo'),
    path('promover/', views.promover_alumnos, name='promover_alumnos'),
]
