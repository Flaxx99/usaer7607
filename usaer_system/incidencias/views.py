from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Incidencia
from .serializers import IncidenciaSerializer
from .permissions import IncidenciaPermission

User = get_user_model()

class IncidenciaViewSet(viewsets.ModelViewSet):
    serializer_class = IncidenciaSerializer
    permission_classes = [IncidenciaPermission]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descripcion', 'profesor__nombre', 'profesor__apellido_paterno']
    ordering_fields = ['fecha_reporte', 'estado']
    ordering = ['-fecha_reporte']

    def get_queryset(self):
        """
        Lógica de filtrado estricta basada en Roles y Escuela.
        """
        user = self.request.user
        queryset = Incidencia.objects.select_related('escuela', 'profesor', 'reportado_por')

        # 1. ADMINISTRADOR (o Superuser): Ve TODO de TODAS las escuelas
        if user.is_superuser or user.role == User.Role.ADMINISTRADOR.value:
            return queryset

        # 2. DIRECTOR: Ve TODO, pero SOLO de SU escuela
        if user.role == User.Role.DIRECTOR.value:
            if not user.escuela:
                return queryset.none() # Seguridad: Director sin escuela no ve nada
            return queryset.filter(escuela=user.escuela)

        # 3. SECRETARIO (Si permitimos que liste): Solo su escuela
        if user.role == User.Role.SECRETARIO.value:
             if not user.escuela:
                return queryset.none()
             return queryset.filter(escuela=user.escuela)

        # 4. MAESTRO APOYO / OTROS:
        # Solo ven lo que ellos reportaron O donde ellos son el involucrado
        return queryset.filter(
            Q(reportado_por=user) | Q(profesor=user)
        )

    def perform_create(self, serializer):
        """
        Al crear:
        1. Asigna 'reportado_por' al usuario actual.
        2. Si el usuario tiene escuela (Director/Secretario/Maestro), FUERZA esa escuela.
        """
        user = self.request.user
        save_kwargs = {'reportado_por': user}

        # Si el usuario tiene una escuela asignada, la incidencia DEBE ser de esa escuela
        if user.escuela:
            save_kwargs['escuela'] = user.escuela
        elif user.role != User.Role.ADMINISTRADOR.value:
             # Si no tiene escuela y no es Admin, no debería poder crear (validación extra)
             raise PermissionDenied("No tienes una escuela asignada para crear incidencias.")

        serializer.save(**save_kwargs)

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        """
        Resuelve la incidencia.
        El get_object() ya aplicó el filtro de escuela, así que un Director
        no podrá resolver incidencias de otra escuela por error.
        """
        incidencia = self.get_object()
        
        if incidencia.estado == 'RESUELTA':
            return Response(
                {"detail": "Esta incidencia ya se encuentra resuelta."},
                status=status.HTTP_400_BAD_REQUEST
            )

        respuesta = request.data.get('respuesta_admin')
        if not respuesta:
            return Response(
                {"detail": "Debes proporcionar una respuesta administrativa."},
                status=status.HTTP_400_BAD_REQUEST
            )

        incidencia.estado = 'RESUELTA'
        incidencia.respuesta_admin = respuesta.upper()
        incidencia.fecha_resolucion = timezone.now()
        incidencia.save()

        # Serializamos para devolver la respuesta actualizada
        serializer = self.get_serializer(incidencia)
        return Response(serializer.data)