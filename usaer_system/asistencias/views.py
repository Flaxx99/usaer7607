from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from services.dto import ChecadorResponse

from .models import Asistencia
from .serializers import AsistenciaSerializer, ChecadorInputSerializer

User = get_user_model()

from rest_framework.throttling import AnonRateThrottle


# ---------------------------------------------------------
# 1. VISTA DEL CHECADOR (PÚBLICA)
# ---------------------------------------------------------
class ChecadorView(views.APIView):
    """
    Endpoint público para registrar asistencias.
    Replica la lógica de 'checar_asistencia'.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = ChecadorInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        codigo = serializer.validated_data["numero_empleado"].strip().upper()
        return self._process_registration(codigo)

    def _process_registration(self, codigo):
        hoy = timezone.localdate()
        ahora = timezone.localtime()

        try:
            profesor = User.objects.select_related("escuela").get(
                Q(numero_empleado=codigo) | Q(curp=codigo), is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado", "status": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except User.MultipleObjectsReturned:
            return Response(
                {"error": "Múltiples coincidencias", "status": "MULTIPLE"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not profesor.escuela:
            return Response(
                {"error": "Sin escuela asignada", "status": "NO_SCHOOL"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asistencia, created = Asistencia.objects.get_or_create(
            profesor=profesor,
            fecha=hoy,
            defaults={
                "escuela": profesor.escuela,
                "presente": True,
                "hora_entrada": ahora.time(),
            },
        )

        profesor_nombre = profesor.get_full_name()
        hora_str = ahora.strftime("%H:%M")

        if created:
            return Response(
                ChecadorResponse(
                    message=f"Entrada registrada a las {asistencia.hora_entrada.strftime('%H:%M')}",
                    tipo="ENTRADA",
                    profesor=profesor_nombre,
                    hora=hora_str,
                ).model_dump(),
                status=status.HTTP_201_CREATED,
            )
        else:
            if asistencia.hora_salida:
                # Retornamos status ALREADY_EXISTS para que el cliente limpie el buffer
                return Response(
                    {
                        "error": "Ya registraste entrada y salida el día de hoy",
                        "status": "ALREADY_EXISTS",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            asistencia.hora_salida = ahora.time()
            asistencia.save(update_fields=["hora_salida"])

            entrada_dt = timezone.datetime.combine(hoy, asistencia.hora_entrada)
            salida_dt = timezone.datetime.combine(hoy, asistencia.hora_salida)
            delta = salida_dt - entrada_dt
            horas, mins = delta.seconds // 3600, (delta.seconds % 3600) // 60

            return Response(
                ChecadorResponse(
                    message=f"Salida registrada a las {asistencia.hora_salida.strftime('%H:%M')}",
                    detalle=f"Horas trabajadas: {horas}h {mins}m",
                    tipo="SALIDA",
                    profesor=profesor_nombre,
                    hora=hora_str,
                ).model_dump(),
                status=status.HTTP_200_OK,
            )


class BulkChecadorView(views.APIView):
    """
    Endpoint público para registrar múltiples asistencias (Sincronización Offline).
    Recibe una lista de números de empleado.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        data = request.data
        if not isinstance(data, list) or not all(isinstance(i, str) for i in data):
            return Response(
                {"error": "Se esperaba una lista de números de empleado (strings)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        with transaction.atomic():
            for codigo in data:
                res = ChecadorView()._process_registration(codigo)

                # Lógica de éxito para el buffer:
                # 1. Status 200/201 -> Registrado OK
                # 2. Status 400 con status 'ALREADY_EXISTS' -> Ya estaba registrado (OK para limpiar buffer)
                is_success = res.status in [200, 201] or (
                    res.status == 400 and res.data.get("status") == "ALREADY_EXISTS"
                )

                results.append({"codigo": codigo, "success": is_success, "data": res.data})

        return Response(results, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# 2. VIEWSET DE HISTORIAL (PRIVADA)
# ---------------------------------------------------------
class AsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AsistenciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["profesor__numero_empleado", "profesor__nombre", "profesor__apellido_paterno"]

    def get_queryset(self):
        user = self.request.user
        queryset = Asistencia.objects.select_related("profesor", "escuela").order_by("-fecha")
        fecha_param = self.request.query_params.get("fecha")
        if fecha_param:
            queryset = queryset.filter(fecha=fecha_param)
        if getattr(user, "is_superuser", False) or user.role == User.Role.ADMINISTRADOR.value:
            return queryset
        return queryset.filter(profesor=user)
