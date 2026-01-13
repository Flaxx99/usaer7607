# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LogoutView, DashboardView

app_name = 'usuarios'

router = DefaultRouter()

# --- CORRECCIÓN AQUÍ ---
# Cambiamos r'users' por r'' (vacío)
# Esto hace que al entrar a /api/usuarios/ recibas la lista directamente
router.register(r'', UserViewSet, basename='usuario') 

urlpatterns = [
    # --- Dashboard ---
    path('dashboard-data/', DashboardView.as_view(), name='dashboard_data'),
    
    # --- Autenticación ---
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # --- Router (CRUD de Usuarios) ---
    # Al poner esto al final, las rutas específicas (como auth/login) tienen prioridad
    path('', include(router.urls)),
]