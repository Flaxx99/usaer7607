# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LogoutView, DashboardView

app_name = 'usuarios'

router = DefaultRouter()
# Registramos el CRUD de usuarios.
# Usamos r'users' para que la URL sea: /usuarios/api/users/
# Si prefieres que sea directo en /usuarios/api/, cambia r'users' por r''
router.register(r'users', UserViewSet, basename='usuario')

urlpatterns = [
    # --- Dashboard ---
    path('dashboard-data/', DashboardView.as_view(), name='dashboard_data'),
    
    # --- Autenticación ---
    # Como LoginView y LogoutView son GenericAPIViews, se definen con path(), no con router
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # --- Router (CRUD de Usuarios) ---
    path('', include(router.urls)),
]