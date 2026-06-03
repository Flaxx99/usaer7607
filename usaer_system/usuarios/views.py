import logging

from django.contrib.auth import get_user_model, login, logout
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import filters, generics, status, views, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from usuarios.permissions import IsAdminOrSecretario

logger = logging.getLogger(__name__)

# --- MODELOS ---
from alumnos.models import Alumno
from avisos.models import Anuncio
from ciclos_escolares.models import CicloEscolar
from escuelas.models import Escuela
from permisos.models import Permiso

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
    UserSerializer,
)

User = get_user_model()

# --- VISTAS DE AUTENTICACIÓN ---


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context=self.get_serializer_context()).data

        return Response({"detail": "Login exitoso", "token": token.key, "user": user_data})


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "auth_token"):
            request.user.auth_token.delete()
        logout(request)
        return Response({"detail": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)


# --- VIEWSET DE USUARIOS (¡ESTO ES LO QUE FALTABA!) ---


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("escuela")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ["numero_empleado", "nombre", "apellido_paterno", "apellido_materno", "email"]

    def get_queryset(self):
        qs = super().get_queryset()

        role = self.request.query_params.get("role")
        escuela = self.request.query_params.get("escuela")
        activo = self.request.query_params.get("activo")

        if role:
            qs = qs.filter(role=role)
        if escuela:
            qs = qs.filter(escuela__id=escuela)
        if activo:
            is_active = activo.lower() in ["1", "true"]
            qs = qs.filter(activo=is_active)

        return qs.order_by("apellido_paterno", "nombre")

    def get_permissions(self):
        """Only admins may list users; other actions require authentication.

        This enforces that non-admin users cannot view the full user list.
        """
        if getattr(self, "action", None) == "list":
            return [IsAuthenticated(), IsAdminOrSecretario()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({"error": "No puedes desactivar tu propia cuenta."}, status=400)

        user.activo = not user.activo
        user.save()
        estado = "activado" if user.activo else "desactivado"
        return Response({"status": f"Usuario {estado}", "activo": user.activo})

    @action(detail=True, methods=["post"], url_path="change-password")
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Contraseña incorrecta."]}, status=400)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"status": "Contraseña actualizada"})

        return Response(serializer.errors, status=400)


# --- DASHBOARD ---


class DashboardView(views.APIView):
    """
    Endpoint maestro para el Dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        ciclo_nombre = "Sin Ciclo Activo"
        try:
            ciclo_actual = CicloEscolar.objects.filter(activo=True).first()
            if ciclo_actual:
                ciclo_nombre = ciclo_actual.nombre
        except Exception:
            pass

        data = {
            "ciclo_actual": ciclo_nombre,
            "ultimos_avisos": [],
            "permisos_pendientes": 0,
            "incidencias_pendientes": 0,
            "stats": {},
            "grafica_clasificacion": [],
            "grafica_escuelas": [],
        }

        try:
            qs_permisos = Permiso.objects.filter(estado="PENDIENTE")
            es_admin = user.role in ["ADMIN", "ADMINISTRADOR"] or user.is_superuser
            es_director = user.role == "DIRECTOR"
            if not es_admin:
                if es_director and user.escuela:
                    qs_permisos = qs_permisos.filter(escuela=user.escuela)
                elif not es_director:
                    qs_permisos = qs_permisos.filter(profesor=user)
                else:
                    qs_permisos = qs_permisos.none()
            data["permisos_pendientes"] = qs_permisos.count()
        except Exception as e:
            logger.error(f"Error contando permisos: {e}")

        try:
            now = timezone.now()
            ultimos_avisos = (
                Anuncio.objects.filter(
                    (Q(fecha_expiracion__gte=now) | Q(fecha_expiracion__isnull=True)),
                    fecha_publicacion__lte=now,
                )
                .select_related("autor")
                .order_by("-fecha_publicacion")[:5]
            )

            data["ultimos_avisos"] = [
                {
                    "id": a.id,
                    "titulo": a.titulo,
                    "contenido": a.contenido,
                    "autor": a.autor.get_full_name()
                    if hasattr(a.autor, "get_full_name")
                    else str(a.autor),
                    "fecha": a.fecha_publicacion,
                }
                for a in ultimos_avisos
            ]
        except Exception as e:
            logger.error(f"Error cargando avisos: {e}")

        try:
            stats_alumnos_escuelas = Alumno.objects.filter(activo=True).aggregate(
                total_alumnos=Count("id"),
            )
            total_escuelas = Escuela.objects.count()

            stats_usuarios = User.objects.filter(activo=True).aggregate(
                total_usuarios=Count("id"),
                total_maestros=Count("id", filter=Q(role="MAESTRO_APOYO")),
            )

            data["stats"] = {
                "total_alumnos": stats_alumnos_escuelas["total_alumnos"] or 0,
                "total_escuelas": total_escuelas,
                "total_usuarios": stats_usuarios["total_usuarios"] or 0,
                "total_maestros": stats_usuarios["total_maestros"] or 0,
            }
        except Exception as e:
            logger.error(f"Error en stats: {e}")
            data["stats"] = {"total_alumnos": 0, "total_escuelas": 0, "total_usuarios": 0}

        try:
            data["grafica_clasificacion"] = list(
                Alumno.objects.filter(activo=True)
                .values("clasificacion")
                .annotate(total=Count("id"))
                .order_by("-total")
            )

            data["grafica_escuelas"] = list(
                Alumno.objects.filter(activo=True)
                .values("escuela__nombre")
                .annotate(total=Count("id"))
                .order_by("-total")[:5]
            )
        except Exception as e:
            logger.error(f"Error en gráficas: {e}")

        return Response(data)


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
