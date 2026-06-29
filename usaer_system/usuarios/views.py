import logging

from django.contrib.auth import get_user_model, login, logout
from django.db.models import Q
from rest_framework import filters, generics, status, views, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from services.dashboard_service import build_dashboard_data
from services.dto import FiltrosUsuario, LoginResponse, StatusDetailResponse, ToggleActiveResponse
from services.error_handling import error_400, error_403

from usuarios.permissions import IsAdminOrSecretario, IsAdminUserOnly

logger = logging.getLogger(__name__)

# Apps pendientes (Incidencias, etc.)
try:
    from calendario.models import EventoCalendario
    from documentos.models import Expediente
    from incidencias.models import Incidencia
    from oficios.models import Oficio
except ImportError:
    pass

from .models import CalendarEvent, SystemConfiguration
from .serializers import (
    CalendarEventSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    SystemConfigurationSerializer,
    UserListSerializer,
    UserSerializer,
)

User = get_user_model()

# --- VISTAS DE AUTENTICACIÓN ---


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer
    throttle_scope = "login"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context=self.get_serializer_context()).data

        return Response(
            LoginResponse(detail="Login exitoso", token=token.key, user=user_data).model_dump()
        )


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "auth_token"):
            request.user.auth_token.delete()
        logout(request)
        return Response(StatusDetailResponse(detail="Sesión cerrada correctamente.").model_dump())


# --- VIEWSET DE USUARIOS (¡ESTO ES LO QUE FALTABA!) ---


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("escuela")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ["numero_empleado", "nombre", "apellido_paterno", "apellido_materno", "email"]

    def initial(self, request, *args, **kwargs):
        """Asigna throttle_scope según la acción, ANTES de check_throttles()."""
        if self.action == "toggle_active":
            self.throttle_scope = "sensitive_action"
        elif self.action == "change_password":
            self.throttle_scope = "change_password"
        super().initial(request, *args, **kwargs)

    def get_serializer_class(self):
        """Usa serializer reducido (sin PII) para listados; el completo para create/update/detail."""
        if self.action == "list":
            return UserListSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        filtros = FiltrosUsuario.model_validate(self.request.query_params.dict())

        if filtros.role:
            qs = qs.filter(role=filtros.role)
        if filtros.escuela:
            qs = qs.filter(escuela__id=filtros.escuela)
        if filtros.activo:
            is_active = filtros.activo.lower() in ["1", "true"]
            qs = qs.filter(activo=is_active)

        return qs.order_by("apellido_paterno", "nombre")

    def get_permissions(self):
        """Admin-only for user management; other actions require auth."""
        admin_only = {
            "list",
            "retrieve",
            "create",
            "update",
            "partial_update",
            "destroy",
            "toggle_active",
        }
        if getattr(self, "action", None) in admin_only:
            return [IsAuthenticated(), IsAdminUserOnly()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return error_400("No puedes desactivar tu propia cuenta.")

        user.activo = not user.activo
        user.save()
        estado = "activado" if user.activo else "desactivado"
        return Response(
            ToggleActiveResponse(status=f"Usuario {estado}", activo=user.activo).model_dump()
        )

    @action(detail=True, methods=["post"], url_path="change-password")
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            is_admin = request.user.is_superuser or getattr(request.user, "role", "") == "ADMIN"

            # Self-service requiere old_password
            if request.user.pk == user.pk:
                if not user.check_password(serializer.data.get("old_password")):
                    return error_400("Contraseña incorrecta.")
            elif not is_admin:
                return error_403("No tienes permiso para cambiar la contraseña de otro usuario.")

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response(
                StatusDetailResponse(status="success", detail="Contraseña actualizada").model_dump()
            )

        return Response(serializer.errors, status=400)


# --- DASHBOARD ---


class DashboardView(views.APIView):
    """
    Endpoint del Dashboard — delega la lógica a servicios independientes.
    Cada sub-consulta maneja sus propios errores; el dashboard nunca falla
    completamente por una pieza rota.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        dashboard_data = build_dashboard_data(request.user)
        return Response(dashboard_data.model_dump())


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all().select_related(
        "created_by", "assigned_to", "alumno", "escuela"
    )
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Admin/Secretario ven todo
        if user.is_superuser or user.role in ["ADMIN", "SECRETARIO"]:
            return qs.order_by("start_time")

        # Docentes ven: lo que crearon, lo que les asignaron o eventos de sus alumnos/escuela
        return qs.filter(
            Q(created_by=user)
            | Q(assigned_to=user)
            | Q(alumno__profesor=user)
            | Q(escuela=user.escuela)
        ).order_by("start_time")


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_superuser and self.request.user.role != "ADMIN":
            return SystemConfiguration.objects.none()
        return super().get_queryset()
