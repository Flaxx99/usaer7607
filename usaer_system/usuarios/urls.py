from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('profesores/',               views.listar_profesores, name='listar_profesores'),
    path('profesores/nuevo/',         views.crear_profesor,    name='crear_profesor'),
    path('profesores/<int:pk>/edit/', views.editar_profesor,   name='editar_profesor'),
    path('profesores/<int:pk>/delete/',views.eliminar_profesor, name='eliminar_profesor'),
]
