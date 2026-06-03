# rac/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExportAllRACView, ExportRACView, RegistroRACViewSet

app_name = "rac"

router = DefaultRouter()
router.register(r"", RegistroRACViewSet, basename="registros")

urlpatterns = [
    # Mantenemos las rutas separadas como solicitaste
    path("exportar/", ExportRACView.as_view(), name="exportar_excel"),
    path("exportar-todo/", ExportAllRACView.as_view(), name="exportar_todo"),
    path("", include(router.urls)),
]
