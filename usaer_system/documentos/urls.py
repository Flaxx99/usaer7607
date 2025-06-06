from django.urls import path
from . import views

app_name = 'documentos'

urlpatterns = [
    path('subir/', views.subir_expediente, name='subir_expediente'),
    path('subido/', views.expediente_subido, name='expediente_subido'),
]