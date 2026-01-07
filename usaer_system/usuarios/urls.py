from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AuthViewSet, DashboardView

app_name = 'usuarios'

router = DefaultRouter()
router.register(r'', UserViewSet, basename='usuarios')
# Registramos el AuthViewSet solo para mapear sus acciones
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
    # Dashboard API
    path('dashboard-data/', DashboardView.as_view(), name='dashboard_data'),
    
    # Rutas generadas por el router (Usuarios CRUD, login, me, etc.)
    path('', include(router.urls)),
]