from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from pydantic import ValidationError
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from services.dto import AlumnoPromoverCommitResponse, AlumnoPromoverResponse, PromoverPayload
from services.error_handling import error_400, error_403, pydantic_error_response
from services.promocion_service import ejecutar_promocion_simple, simular_promocion_simple

from .models import Alumno
from .permissions import IsMaestroOAdmin
from .serializers import AlumnoSerializer

User = get_user_model()


class AlumnoViewSet(viewsets.ModelViewSet):
    serializer_class = AlumnoSerializer
    permission_classes = [IsMaestroOAdmin]

    # Configuración de búsqueda
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombres", "apellido_paterno", "apellido_materno", "curp"]
    ordering_fields = ["apellido_paterno", "nombres"]
    ordering = ["apellido_paterno", "nombres"]

    def initial(self, request, *args, **kwargs):
        """Asigna throttle_scope según la acción, ANTES de check_throttles()."""
        if self.action == "promover" and request.method == "POST":
            self.throttle_scope = "bulk_write"
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        """
        Lógica de filtrado según el rol y parámetros de consulta para paginación/búsqueda.
        """
        user = self.request.user
        queryset = Alumno.objects.select_related("escuela", "profesor")

        # 1. Filtro base por Rol
        if not user.is_superuser:
            if user.role == User.Role.MAESTRO_APOYO.value:
                # El maestro siempre ve solo sus alumnos asignados
                queryset = queryset.filter(profesor=user)
            elif user.role in [
                User.Role.ADMINISTRADOR.value,
                User.Role.DIRECTOR.value,
                User.Role.SECRETARIO.value,
            ]:
                # Administradores, directores y secretarios ven todos
                pass
            else:
                return Alumno.objects.none()

        # 2. Filtros de query params (Soporte para paginación del servidor con filtros)
        escuela = self.request.query_params.get("escuela")
        condicion = self.request.query_params.get("condicion")
        estado = self.request.query_params.get("estado", "ACTIVOS")

        if escuela and escuela != "TODAS":
            queryset = queryset.filter(escuela__id=escuela)

        if condicion and condicion != "TODAS":
            queryset = queryset.filter(clasificacion=condicion)

        if estado == "ACTIVOS":
            queryset = queryset.filter(activo=True)
        elif estado == "BAJAS":
            queryset = queryset.filter(activo=False)
        # Si es 'TODOS', no filtramos por activo

        return queryset.order_by("apellido_paterno", "nombres")

    def perform_create(self, serializer):
        """
        Lógica de asignación de profesor:
        1. Si el frontend manda un ID en 'profesor', se respeta (Admin asignando a Maestro).
        2. Si no manda nada y el usuario es MAESTRO_APOYO, se auto-asigna.
        """
        user = self.request.user

        # Obtenemos el dato crudo del request
        profesor_id = self.request.data.get("profesor")

        # Si viene un ID válido (no vacío ni nulo), guardamos tal cual
        if profesor_id:
            serializer.save()

        # Si no seleccionó nada y es Maestro, se asigna a sí mismo
        elif user.role == User.Role.MAESTRO_APOYO.value:
            serializer.save(profesor=user)

        # Si es Admin y no seleccionó nada, se guarda sin profesor (o null)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {
                    "detail": "No se puede eliminar el alumno porque tiene registros asociados (ej. asistencias, expedientes)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @swagger_auto_schema(
        method="get",
        operation_description="Simulación de promoción: muestra cuántos alumnos serían promovidos o graduados.",
    )
    @swagger_auto_schema(
        method="post",
        operation_description="Ejecución real de la promoción de alumnos.",
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
            200: openapi.Response("Promoción ejecutada exitosamente"),
            400: openapi.Response("Falta el campo 'confirmed' o valor inválido"),
            403: openapi.Response("No tienes permisos para promover alumnos"),
        },
    )
    @action(detail=False, methods=["get", "post"])
    def promover(self, request):
        """
        Promueve alumnos al siguiente grado.
        GET: Simulación — muestra cuántos serían promovidos/graduados.
        POST con {"confirmed": true}: Ejecuta la promoción real.
        - Alumnos de grado 6 se gradúan (activo=False, grupo limpiado).
        - Alumnos de grado 1-5 se promueven (grado+1, grupo limpiado).
        Solo ADMIN y SECRETARIO pueden ejecutar.

        Protección de Idempotencia: No promueve alumnos que ya fueron promovidos en el ciclo actual.
        """
        user = request.user
        roles_autorizados = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if not (user.is_superuser or user.role in roles_autorizados):
            return error_403("Solo administradores y secretarios pueden promover alumnos.")

        try:
            ciclo_actual = get_current_ciclo_escolar_instance()
        except Exception as e:
            return error_400(f"Error al determinar ciclo escolar: {e}")

        # FILTRO DE IDEMPOTENCIA: Solo alumnos activos que NO hayan sido promovidos en este ciclo
        alumnos_activos = Alumno.objects.activos().exclude(last_promotion_cycle=ciclo_actual)

        # GET = simulación
        if request.method == "GET":
            promovidos, graduados, omitidos = simular_promocion_simple(alumnos_activos)
            return Response(
                AlumnoPromoverResponse(
                    simulation=True,
                    ciclo_actual=ciclo_actual.nombre,
                    total_pendientes=alumnos_activos.count(),
                    a_promover=len(promovidos),
                    a_graduar=len(graduados),
                    omitidos=len(omitidos),
                    promovidos=promovidos,
                    graduados=graduados,
                    omitidos_detalle=omitidos,
                ).model_dump()
            )

        # POST = ejecución real — validar payload con pydantic
        try:
            payload = PromoverPayload(**request.data)
        except ValidationError as e:
            return pydantic_error_response(
                e, default_detail="Datos inválidos en la solicitud de promoción."
            )

        if not payload.confirmed:
            return error_400("Debes enviar {'confirmed': true} para ejecutar la promoción.")

        promovidos_count, graduados_count, errores = ejecutar_promocion_simple(
            alumnos_activos, ciclo_actual
        )

        return Response(
            AlumnoPromoverCommitResponse(
                simulation=False,
                ciclo_promocion=ciclo_actual.nombre,
                promovidos_count=promovidos_count,
                graduados_count=graduados_count,
                errores=errores,
                detail=f"{promovidos_count} alumnos promovidos, {graduados_count} graduados en el ciclo {ciclo_actual.nombre}.",
            ).model_dump()
        )
