from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AsistenciaViewSet, ChecadorView

app_name = "asistencias"

router = DefaultRouter()
router.register(r"", AsistenciaViewSet, basename="asistencias")

urlpatterns = [
    # Ruta pública para el kiosco (POST)
    path("checar/", ChecadorView.as_view(), name="checar"),
    # Rutas privadas para el historial (GET)
    path("", include(router.urls)),
]
