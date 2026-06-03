from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Permiso
from .permissions import IsAdminDirectorOrOwner
from .serializers import PermisoSerializer

User = get_user_model()


class PermisoViewSet(viewsets.ModelViewSet):
    serializer_class = PermisoSerializer
    permission_classes = [IsAdminDirectorOrOwner]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["motivo", "profesor__nombre", "profesor__apellido_paterno"]
    ordering_fields = ["fecha_solicitud", "fecha_inicio", "estado"]
    ordering = ["-fecha_solicitud"]

    def get_queryset(self):
        """
        Replica toda la lógica de filtrado de 'mis_permisos' y 'gestionar_permisos'.
        """
        user = self.request.user
        queryset = Permiso.objects.select_related("profesor", "escuela", "administrador")

        # --- 1. FILTRO BASE POR ROL ---
        if user.is_superuser or user.role == User.Role.ADMINISTRADOR.value:
            # Admin ve todo
            pass
        elif user.role == User.Role.DIRECTOR.value:
            # Director ve solo su escuela
            if user.escuela:
                queryset = queryset.filter(escuela=user.escuela)
            else:
                return queryset.none()
        else:
            # Maestros ven solo lo suyo
            queryset = queryset.filter(profesor=user)

        # --- 2. FILTROS DINÁMICOS (Query Params) ---
        # Estos replican tus 'request.GET.get(...)' originales

        # Filtro por Estado
        estado = self.request.query_params.get("estado")
        if estado:
            queryset = queryset.filter(estado=estado)

        # Filtro por Escuela (Solo para Admin)
        escuela_id = self.request.query_params.get("escuela")
        if escuela_id and (user.is_superuser or user.role == User.Role.ADMINISTRADOR.value):
            queryset = queryset.filter(escuela__id=escuela_id)

        # Filtro por Profesor (Para Admin/Director)
        profesor_id = self.request.query_params.get("profesor")
        if profesor_id:
            queryset = queryset.filter(profesor__id=profesor_id)

        # Filtro por Año (Común en 'mis_permisos')
        anio = self.request.query_params.get("anio") or self.request.query_params.get("año")
        if anio:
            queryset = queryset.filter(fecha_solicitud__year=anio)

        # Filtro por Rango de Fechas (Común en 'gestionar_permisos')
        fecha_desde = self.request.query_params.get("fecha_desde")
        fecha_hasta = self.request.query_params.get("fecha_hasta")
        if fecha_desde:
            queryset = queryset.filter(fecha_solicitud__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_solicitud__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        """
        Asigna automáticamente el profesor y su escuela al crear.
        """
        user = self.request.user
        escuela = getattr(user, "escuela", None)
        if not escuela:
            raise serializers.ValidationError(
                {
                    "detail": "No tienes una escuela asignada en tu perfil. No puedes solicitar permisos."
                }
            )
        serializer.save(profesor=user, escuela=escuela)

    @action(detail=True, methods=["post"])
    def responder(self, request, pk=None):
        """
        Aprueba o Rechaza un permiso.
        Payload: { "estado": "APROBADO", "respuesta_admin": "..." }
        """
        permiso = self.get_object()

        # VALIDACIÓN DE IDEMPOTENCIA: Solo se puede responder a permisos PENDIENTES
        if permiso.estado != Permiso.Estado.PENDIENTE:
            return Response(
                {
                    "detail": f"Este permiso ya ha sido gestionado y se encuentra en estado {permiso.get_estado_display()}. No se puede modificar."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar autoridad (Director/Admin)
        roles_autoridad = [User.Role.ADMINISTRADOR.value, User.Role.DIRECTOR.value]
        if request.user.role not in roles_autoridad and not request.user.is_superuser:
            return Response(
                {"detail": "No tienes permiso para responder."}, status=status.HTTP_403_FORBIDDEN
            )

        estado = request.data.get("estado")
        respuesta = request.data.get("respuesta_admin", "")

        if estado not in [Permiso.Estado.APROBADO, Permiso.Estado.RECHAZADO]:
            return Response({"detail": "Estado inválido."}, status=status.HTTP_400_BAD_REQUEST)

        if estado == Permiso.Estado.RECHAZADO and not respuesta:
            return Response(
                {"detail": "Debe justificar el rechazo."}, status=status.HTTP_400_BAD_REQUEST
            )

        permiso.estado = estado
        permiso.respuesta_admin = respuesta.upper()
        permiso.administrador = request.user
        permiso.fecha_respuesta = timezone.now()
        permiso.save()

        return Response(self.get_serializer(permiso).data)

    @action(detail=False, methods=["get"])
    def metricas(self, request):
        """
        Endpoint especial para pintar las tarjetas del Dashboard.
        Replica el diccionario 'metricas' de tu views.py original.
        """
        qs = self.get_queryset()  # Reutilizamos filtros de rol/escuela

        total = qs.count()
        pendientes = qs.filter(estado=Permiso.Estado.PENDIENTE).count()
        aprobados = qs.filter(estado=Permiso.Estado.APROBADO).count()
        rechazados = qs.filter(estado=Permiso.Estado.RECHAZADO).count()

        # Última semana (útil para administradores)
        ultima_semana = qs.filter(
            fecha_solicitud__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()

        return Response(
            {
                "total": total,
                "pendientes": pendientes,
                "aprobados": aprobados,
                "rechazados": rechazados,
                "ultima_semana": ultima_semana,
            }
        )
