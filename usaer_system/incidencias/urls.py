from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IncidenciaViewSet

app_name = "incidencias"

router = DefaultRouter()
router.register(r"", IncidenciaViewSet, basename="incidencias")

urlpatterns = [
    path("", include(router.urls)),
]
