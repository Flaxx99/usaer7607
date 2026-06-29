import logging

from alumnos.models import Alumno
from django.db import transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from pydantic import ValidationError
from rest_framework import permissions, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from services.dto import PromocionExecResponse, PromocionPreviewResponse, PromoverPayload
from services.error_handling import error_400, error_404, error_500, pydantic_error_response
from services.promocion_service import (
    ejecutar_promocion_por_nivel,
    simular_promocion_por_nivel,
)

# Modelos
from .models import CicloEscolar

# Serializers
from .serializers import CicloEscolarSerializer

logger = logging.getLogger(__name__)


class IsAdminOrSecretario(permissions.BasePermission):
    """Administradores y Secretarios pueden gestionar ciclos (coincide con el frontend)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser
            or getattr(request.user, "role", "")
            in [
                "ADMIN",
                "SECRETARIO",
            ]
        )


class CicloEscolarViewSet(viewsets.ModelViewSet):
    queryset = CicloEscolar.objects.all().order_by("-fecha_inicio")
    serializer_class = CicloEscolarSerializer
    permission_classes = [IsAdminOrSecretario]

    @action(detail=False, methods=["get"])
    def activo(self, request):
        """Endpoint para obtener el ciclo activo."""
        try:
            ciclo = CicloEscolar.objects.get(activo=True)
            serializer = self.get_serializer(ciclo)
            return Response(serializer.data)
        except CicloEscolar.DoesNotExist:
            return error_404("No hay ciclo activo configurado.")


class PromocionAlumnosView(views.APIView):
    """
    Gestiona la promoción masiva.
    GET: Simulación (Preview)
    POST: Ejecución Real (Commit)
    """

    permission_classes = [IsAdminOrSecretario]

    def initial(self, request, *args, **kwargs):
        """bulk_write solo aplica al POST (commit), no al GET (preview)."""
        if request.method == "POST":
            self.throttle_scope = "bulk_write"
        super().initial(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Simulación de promoción: calcula cuántos alumnos serían promovidos o graduados sin guardar cambios.",
        responses={
            200: openapi.Response(
                description="Resultado de la simulación",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "total_activos": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "a_promover_count": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "a_graduar_count": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "errores_count": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "detalles_promover": openapi.Schema(
                            type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)
                        ),
                        "detalles_graduar": openapi.Schema(
                            type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)
                        ),
                        "detalles_errores": openapi.Schema(
                            type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)
                        ),
                    },
                ),
            ),
            500: openapi.Response("Error interno en la simulación"),
        },
    )
    def get(self, request):
        """Simulación (Preview)"""
        try:
            alumnos_activos = Alumno.objects.filter(activo=True).select_related("escuela")
            data = simular_promocion_por_nivel(alumnos_activos)
            return Response(
                PromocionPreviewResponse(
                    total_activos=Alumno.objects.activos().count(),
                    a_promover_count=len(data["promover"]),
                    a_graduar_count=len(data["graduar"]),
                    errores_count=len(data["errores"]),
                    detalles_promover=data["promover"],
                    detalles_graduar=data["graduar"],
                    detalles_errores=data["errores"],
                ).model_dump()
            )
        except Exception:
            logger.exception("Error en simulación de promoción (GET)")
            return error_500("Error interno en la simulación.")

    @swagger_auto_schema(
        operation_description="Ejecución real de la promoción masiva de alumnos.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "confirmed": openapi.Schema(
                    type=openapi.TYPE_BOOLEAN,
                    description="Debe ser True para ejecutar la promoción real",
                )
            },
            required=["confirmed"],
        ),
        responses={
            200: openapi.Response(
                description="Promoción ejecutada exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "status": openapi.Schema(type=openapi.TYPE_STRING),
                        "detail": openapi.Schema(type=openapi.TYPE_STRING),
                        "promovidos": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "graduados": openapi.Schema(type=openapi.TYPE_INTEGER),
                    },
                ),
            ),
            400: openapi.Response("Falta la confirmación o valor inválido"),
        },
    )
    def post(self, request):
        """Ejecución Real"""
        # Validar payload con pydantic
        try:
            payload = PromoverPayload(**request.data)
        except ValidationError as e:
            return pydantic_error_response(
                e, default_detail="Datos inválidos en la solicitud de promoción."
            )

        if not payload.confirmed:
            return error_400("Se requiere confirmar la acción.")

        with transaction.atomic():
            alumnos_activos = Alumno.objects.activos().select_related("escuela")
            promovidos, graduados = ejecutar_promocion_por_nivel(alumnos_activos)
            CicloEscolar.objects.filter(activo=True).update(activo=False)

            return Response(
                PromocionExecResponse(
                    detail=f"Proceso finalizado. {promovidos} promovidos, {graduados} graduados.",
                    promovidos=promovidos,
                    graduados=graduados,
                ).model_dump()
            )
