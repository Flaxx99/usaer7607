# ciclos_escolares/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CicloEscolarViewSet, PromocionAlumnosView

app_name = 'ciclos'

router = DefaultRouter()
router.register(r'', CicloEscolarViewSet, basename='ciclos')

urlpatterns = [
    # Endpoint especial fuera del router
    path('promover-alumnos/', PromocionAlumnosView.as_view(), name='promover_alumnos'),
    
    path('', include(router.urls)),
]
