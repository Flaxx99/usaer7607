from django.urls import path
from .views import (
    subir_expediente,
    editar_expediente,
    ExpedienteListView,
    ExpedienteDeleteView,
)

app_name = 'documentos'

urlpatterns = [
    path('subir/', subir_expediente, name='subir_expediente'),
    path('lista/', ExpedienteListView.as_view(), name='lista_expedientes'),
    path('editar/<int:pk>/', editar_expediente, name='editar_expediente'),
    path('<int:pk>/eliminar/', ExpedienteDeleteView.as_view(), name='eliminar_expediente'),
]
