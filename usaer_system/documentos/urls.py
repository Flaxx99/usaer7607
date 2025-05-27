from django.urls import path
from . import views

app_name = 'documentos'

urlpatterns = [
    # ... otras URLs ...
    path('rae/', views.listar_rae, name='listar_rae'),
]