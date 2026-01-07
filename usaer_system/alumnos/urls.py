from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlumnoViewSet

app_name = 'alumnos'

router = DefaultRouter()
router.register(r'', AlumnoViewSet, basename='alumnos')

urlpatterns = [
    path('', include(router.urls)),
]