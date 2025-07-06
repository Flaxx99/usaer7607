# oficios/urls.py
from django.urls import path
from . import views

app_name = 'oficios'

urlpatterns = [
    path('', views.lista_oficios, name='lista_oficios'),
    path('subir/', views.subir_oficio, name='subir_oficio'),
    path('eliminar/<int:pk>/', views.eliminar_oficio, name='eliminar_oficio'),
    path('<int:pk>/editar/', views.editar_oficio, name='editar_oficio'),
]
