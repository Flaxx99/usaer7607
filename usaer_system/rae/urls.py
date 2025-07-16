from django.urls import path
from .views import CapturaRAEView, ExportRAEExcelView

app_name = 'rae'
urlpatterns = [
    path('exportar/', ExportRAEExcelView.as_view(), name='exportar'),
    path('captura/', CapturaRAEView.as_view(), name='captura'),

]