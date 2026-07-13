# usuarios/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import DashboardView, LoginView, LogoutView, UserViewSet

app_name = "usuarios"

router = DefaultRouter()

# --- CORRECCIÓN AQUÍ ---
# Cambiamos r'users' por r'' (vacío)
# Esto hace que al entrar a /api/usuarios/ recibas la lista directamente
router.register(r"", UserViewSet, basename="usuario")

urlpatterns = [
    # --- Dashboard ---
    path("dashboard-data/", DashboardView.as_view(), name="dashboard_data"),
    # --- Autenticación ---
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    # --- JWT Tokens ---
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # --- Router (CRUD de Usuarios) ---
    # Al poner esto al final, las rutas específicas (como auth/login) tienen prioridad
    path("", include(router.urls)),
]
