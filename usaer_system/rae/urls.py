# usaer_system/rae/urls.py

from django.urls import path
from .views import CapturaRAEView, ExportRAEExcelView, SaveRAEBulkView, RegistroRAEListView, ExportAllRAEExcelView # Asegúrate de que ExportAllRAEExcelView esté importado si lo usas

app_name = 'rae'

urlpatterns = [
    # URL para la captura de RAE de un registro específico
    path('captura/', CapturaRAEView.as_view(), name='captura_rae'), # CORREGIDO: .as_view()

    # URL para guardar todas las fichas RAE de un registro en un solo POST (bulk save)
    path('guardar_bulk/', SaveRAEBulkView.as_view(), name='guardar_rae_bulk'), # CORREGIDO: .as_view()

    # URL para listar los registros RAE existentes (donde se selecciona cuál exportar)
    path('mis_registros/', RegistroRAEListView.as_view(), name='mis_registros_rae'), # CORREGIDO: .as_view()

    # URL para exportar un registro RAE específico a Excel
    path('exportar_excel/<int:pk>/', ExportRAEExcelView.as_view(), name='exportar_rae_excel'),

    # URL para exportar todos los registros RAE a Excel (si la tienes implementada)
    path('exportar_todo_excel/', ExportAllRAEExcelView.as_view(), name='exportar_todo_rae_excel'),
]