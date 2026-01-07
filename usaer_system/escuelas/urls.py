from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EscuelaViewSet

app_name = 'escuelas'

router = DefaultRouter()
router.register(r'', EscuelaViewSet, basename='escuelas')

urlpatterns = [
    path('', include(router.urls)),
]