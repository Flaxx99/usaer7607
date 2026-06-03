# avisos/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AnuncioViewSet

app_name = "avisos"

router = DefaultRouter()
router.register(r"", AnuncioViewSet, basename="anuncios")

urlpatterns = [
    path("", include(router.urls)),
]
