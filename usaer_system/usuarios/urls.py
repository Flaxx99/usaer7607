from django.urls import path
from . import views

app_name = 'usuarios'
urlpatterns = [
<<<<<<< HEAD
    path('profesores/',               views.listar_profesores, name='listar_profesores'),
    path('profesores/nuevo/',         views.crear_profesor,    name='crear_profesor'),
    path('profesores/<int:pk>/edit/', views.editar_profesor,   name='editar_profesor'),
    path('profesores/<int:pk>/delete/',views.eliminar_profesor, name='eliminar_profesor'),
=======
    path('profesores/',         views.listar_profesores,  name='listar_profesores'),
    path('profesores/nuevo/',   views.crear_profesor,     name='crear_profesor'),
    path('profesores/<int:pk>/edit/',   views.editar_profesor,   name='editar_profesor'),
    path('profesores/<int:pk>/delete/', views.eliminar_profesor, name='eliminar_profesor'),
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
]
