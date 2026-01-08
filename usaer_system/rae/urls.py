# usaer_system/rae/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RAEInitCaptureView, 
    RAEBulkSaveView, 
    RegistroRAEViewSet, 
    ExportRAEView, 
    ExportAllRAEView
)

app_name = 'rae'

# Router opcional (por si quieres acceso estándar RESTful en el futuro)
router = DefaultRouter()
router.register(r'', RegistroRAEViewSet, basename='registros')

urlpatterns = [
    # 1. Captura (Inicialización de datos)
    path('captura/', RAEInitCaptureView.as_view(), name='captura_rae'),

    # 2. Guardado Masivo (Bulk Save)
    path('guardar_bulk/', RAEBulkSaveView.as_view(), name='guardar_rae_bulk'),

    # 3. Listado (Mis Registros)
    # Mapeamos la acción 'list' del ViewSet a esta URL específica
    path('mis_registros/', RegistroRAEViewSet.as_view({'get': 'list'}), name='mis_registros_rae'),

    # 4. Exportar Uno
    path('exportar_excel/<int:pk>/', ExportRAEView.as_view(), name='exportar_rae_excel'),

    # 5. Exportar Todo
    path('exportar_todo_excel/', ExportAllRAEView.as_view(), name='exportar_todo_rae_excel'),

    # Rutas por defecto del router (opcional, para /api/rae/pk/ etc)
    path('', include(router.urls)),
]