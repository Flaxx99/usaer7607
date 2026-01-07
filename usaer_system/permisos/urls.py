from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PermisoViewSet

app_name = 'permisos'

router = DefaultRouter()
router.register(r'', PermisoViewSet, basename='permisos')

urlpatterns = [
    path('', include(router.urls)),
]