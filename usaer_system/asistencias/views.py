from rest_framework import viewsets, views, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model

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
    permission_classes = [AllowAny] # ¡Importante! No requiere token
    authentication_classes = [] 
    throttle_classes = [AnonRateThrottle] # Protege contra brute force

    def post(self, request):
        serializer = ChecadorInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        codigo = serializer.validated_data['numero_empleado'].strip().upper()
        hoy = timezone.localdate()
        ahora = timezone.localtime()

        # 1. Buscar al profesor
        try:
            profesor = User.objects.select_related('escuela').get(
                Q(numero_empleado=codigo) | Q(curp=codigo),
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Código o CURP no encontrado o usuario inactivo."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except User.MultipleObjectsReturned:
            return Response(
                {"detail": "Error de sistema: Existen múltiples coincidencias. Contacte al administrador."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 2. Validar Escuela
        if not profesor.escuela:
            return Response(
                {"detail": "Este usuario no tiene una escuela asignada."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Lógica de Entrada vs Salida (get_or_create)
        asistencia, created = Asistencia.objects.get_or_create(
            profesor=profesor,
            fecha=hoy,
            defaults={
                'escuela': profesor.escuela,
                'presente': True,
                'hora_entrada': ahora.time(),
            }
        )

        datos_respuesta = {
            "profesor": profesor.get_full_name(),
            "hora": ahora.strftime('%H:%M')
        }

        # CASO A: Registro Nuevo -> ENTRADA
        if created:
            return Response({
                "message": f"Entrada registrada a las {asistencia.hora_entrada.strftime('%H:%M')}",
                "tipo": "ENTRADA",
                **datos_respuesta
            }, status=status.HTTP_201_CREATED)

        # CASO B: Registro Existente -> SALIDA o ERROR
        else:
            if asistencia.hora_salida:
                # Ya tenía salida registrada
                return Response({
                    "detail": "Ya registraste entrada y salida el día de hoy.",
                    "tipo": "ERROR"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Registrar SALIDA
                asistencia.hora_salida = ahora.time()
                asistencia.save(update_fields=['hora_salida'])

                # Calcular horas trabajadas
                entrada_dt = timezone.datetime.combine(hoy, asistencia.hora_entrada)
                salida_dt = timezone.datetime.combine(hoy, asistencia.hora_salida)
                delta = salida_dt - entrada_dt
                
                horas = delta.seconds // 3600
                mins = (delta.seconds % 3600) // 60

                return Response({
                    "message": f"Salida registrada a las {asistencia.hora_salida.strftime('%H:%M')}",
                    "detalle": f"Horas trabajadas: {horas}h {mins}m",
                    "tipo": "SALIDA",
                    **datos_respuesta
                }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# 2. VIEWSET DE HISTORIAL (PRIVADA)
# ---------------------------------------------------------
class AsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint para ver el historial.
    - Admin: Ve todo.
    - Profesor: Ve solo lo suyo.
    Permite filtrar por fecha y búsqueda de nombre.
    """
    serializer_class = AsistenciaSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['profesor__numero_empleado', 'profesor__nombre', 'profesor__apellido_paterno']

    def get_queryset(self):
        user = self.request.user
        # Ordenamos por fecha descendente
        queryset = Asistencia.objects.select_related('profesor', 'escuela').order_by('-fecha')

        # Filtro opcional por fecha (ej: ?fecha=2023-10-20)
        fecha_param = self.request.query_params.get('fecha')
        if fecha_param:
            queryset = queryset.filter(fecha=fecha_param)

        # Lógica de Roles: Admins (o superusers) ven todo; docentes ven sólo lo suyo
        if getattr(user, 'is_superuser', False) or user.role == User.Role.ADMINISTRADOR.value:
            return queryset
        return queryset.filter(profesor=user)
