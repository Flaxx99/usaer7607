# calendario/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventoCalendarioViewSet

app_name = "calendario"

router = DefaultRouter()
router.register(r"", EventoCalendarioViewSet, basename="eventos")

urlpatterns = [
    path("", include(router.urls)),
]
