from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpedienteViewSet

app_name = 'documentos'

router = DefaultRouter()
router.register(r'', ExpedienteViewSet, basename='documentos')

urlpatterns = [
    path('', include(router.urls)),
]