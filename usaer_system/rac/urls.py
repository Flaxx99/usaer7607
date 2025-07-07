# rac/urls.py

from django.urls import path
from .views import (
    RegistroRACListView,
    RegistroRACCreateView,
    RegistroRACUpdateView,
    ExportRACExcelView,
)

app_name = 'rac'

urlpatterns = [
    path('', RegistroRACListView.as_view(), name='registro_list'),
    path('nuevo/', RegistroRACCreateView.as_view(), name='registro_create'),
    path('<int:pk>/editar/', RegistroRACUpdateView.as_view(), name='registro_edit'),
    path('exportar/', ExportRACExcelView.as_view(), name='registro_export'),

]
