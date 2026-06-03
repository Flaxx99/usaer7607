# oficios/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OficioViewSet

app_name = "oficios"

router = DefaultRouter()
router.register(r"", OficioViewSet, basename="oficios")

urlpatterns = [
    path("", include(router.urls)),
]
