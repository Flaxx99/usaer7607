from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('',                    views.listar_profesores,  name='listar_profesores'),
    path('crear/',              views.crear_profesor,     name='crear_profesor'),
    path('editar/<int:pk>/',    views.editar_profesor,    name='editar_profesor'),
    path('eliminar/<int:pk>/',  views.eliminar_profesor,  name='eliminar_profesor'),
    path('detalle/<int:pk>/',   views.detalle_profesor,   name='detalle_profesor'),
]
