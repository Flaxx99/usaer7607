# notificaciones/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificacionViewSet

app_name = "notificaciones"

router = DefaultRouter()
router.register(r"", NotificacionViewSet, basename="notificaciones")

urlpatterns = [
    path("", include(router.urls)),
]
