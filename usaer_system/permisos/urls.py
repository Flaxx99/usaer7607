from django.urls import path
from . import views

app_name = 'permisos'
urlpatterns = [
    path('',               views.listar_permisos,     name='listar_permisos'),
    path('nuevo/',         views.crear_permiso,       name='crear_permiso'),
    path('revisar/',       views.revisar_permisos,    name='revisar_permisos'),
    path('<int:pk>/edit/', views.editar_permiso,      name='editar_permiso'),
    # si implementas eliminación
    # path('<int:pk>/delete/', views.eliminar_permiso, name='eliminar_permiso'),
]
