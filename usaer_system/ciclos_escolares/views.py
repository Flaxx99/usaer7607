import traceback

from alumnos.models import Alumno
from django.db import transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

# Modelos
from .models import CicloEscolar

# Serializers
from .serializers import CicloEscolarSerializer, PromocionPreviewSerializer


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
            return Response({"detail": "No hay ciclo activo configurado."}, status=404)


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

    def get_nivel_alumno(self, alumno):
        """Busca el nivel educativo en la Escuela del alumno."""
        try:
            if alumno.escuela and hasattr(alumno.escuela, "nivel"):
                return str(alumno.escuela.nivel).upper()
        except Exception:
            pass
        return "PRIMARIA"

    def get_max_grado(self, nivel_str):
        """Devuelve el grado máximo según el nivel detectado."""
        n = str(nivel_str).upper()
        if "PREESCOLAR" in n:
            return 3
        if "SECUNDARIA" in n or "TELESECUNDARIA" in n:
            return 3
        return 6

    def get_alumnos_data(self):
        """Calcula la lógica de promoción sin guardar."""
        alumnos_activos = Alumno.objects.filter(activo=True)
        resultado = {"promover": [], "graduar": [], "errores": []}
        for alumno in alumnos_activos:
            nombre_str = alumno.get_full_name()
            try:
                if not alumno.grado:
                    continue
                numeros = "".join(filter(str.isdigit, str(alumno.grado)))
                if not numeros:
                    raise ValueError(f"Grado inválido: {alumno.grado}")
                grado_actual = int(numeros)
                nivel_detectado = self.get_nivel_alumno(alumno)
                tope_grado = self.get_max_grado(nivel_detectado)
                if grado_actual >= tope_grado:
                    resultado["graduar"].append(
                        f"{nombre_str} ({nivel_detectado} {grado_actual}° -> Egresado)"
                    )
                else:
                    resultado["promover"].append(
                        f"{nombre_str} ({nivel_detectado} {grado_actual}° -> {grado_actual + 1}°)"
                    )
            except Exception as e:
                print(f"Error procesando alumno {alumno.id}: {e}")
                resultado["errores"].append(f"{nombre_str}: {str(e)}")
        return resultado

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
            data = self.get_alumnos_data()
            response_data = {
                "total_activos": Alumno.objects.activos().count(),
                "a_promover_count": len(data["promover"]),
                "a_graduar_count": len(data["graduar"]),
                "errores_count": len(data["errores"]),
                "detalles_promover": data["promover"],
                "detalles_graduar": data["graduar"],
                "detalles_errores": data["errores"],
            }
            serializer = PromocionPreviewSerializer(response_data)
            return Response(serializer.data)
        except Exception as e:
            print("!!! ERROR CRITICO EN PROMOCION (GET) !!!")
            traceback.print_exc()
            return Response({"detail": f"Error interno: {str(e)}"}, status=500)

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
        if not request.data.get("confirmed"):
            return Response({"detail": "Se requiere confirmar la acción."}, status=400)

        with transaction.atomic():
            alumnos_activos = Alumno.objects.activos()
            promovidos = 0
            graduados = 0

            for alumno in alumnos_activos:
                try:
                    if not alumno.grado:
                        continue
                    numeros = "".join(filter(str.isdigit, str(alumno.grado)))
                    if not numeros:
                        continue

                    grado_actual = int(numeros)
                    nivel_detectado = self.get_nivel_alumno(alumno)
                    tope_grado = self.get_max_grado(nivel_detectado)

                    if grado_actual >= tope_grado:
                        alumno.activo = False
                        graduados += 1
                    else:
                        alumno.grado = str(grado_actual + 1)
                        alumno.grupo = ""
                        promovidos += 1

                    alumno.save()
                except Exception:
                    continue

            CicloEscolar.objects.filter(activo=True).update(activo=False)

            return Response(
                {
                    "status": "success",
                    "detail": f"Proceso finalizado. {promovidos} promovidos, {graduados} graduados.",
                    "promovidos": promovidos,
                    "graduados": graduados,
                }
            )
