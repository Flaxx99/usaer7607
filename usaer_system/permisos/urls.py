from django.urls import path
from . import views

app_name = 'permisos'

urlpatterns = [
    # Profesor
    path('solicitar/', views.crear_permiso,    name='crear_permiso'),
    path('mis-permisos/', views.listar_permisos, name='listar_permisos'),

    # Administrador
    path('revisar/',    views.revisar_permisos, name='revisar_permisos'),
    path('editar/<int:pk>/',  views.editar_permiso,   name='editar_permiso'),
    path('eliminar/<int:pk>/',views.eliminar_permiso, name='eliminar_permiso'),
]
