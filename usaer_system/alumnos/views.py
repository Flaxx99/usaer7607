from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.db.models import ProtectedError
from django.contrib.auth import get_user_model

from .models import Alumno
from .serializers import AlumnoSerializer
from .permissions import IsMaestroOAdmin

User = get_user_model()

class AlumnoViewSet(viewsets.ModelViewSet):
    serializer_class = AlumnoSerializer
    permission_classes = [IsMaestroOAdmin]  # <--- Seguridad Estricta
    
    # Configuración de búsqueda (Igual que tu variable 'q')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombres', 'apellido_paterno', 'apellido_materno', 'curp']
    ordering_fields = ['apellido_paterno', 'nombres']
    ordering = ['apellido_paterno', 'nombres']

    def get_queryset(self):
        """
        Lógica de filtrado según el rol (Admin ve todo, Maestro ve lo suyo).
        """
        user = self.request.user
        
        # Optimizamos con select_related para traer datos de escuela en 1 sola query
        queryset = Alumno.objects.select_related('escuela', 'profesor')

        # Si es Superusuario, ve todo
        if user.is_superuser:
            return queryset

        # CASO 1: Maestro de Apoyo (Solo sus alumnos activos)
        if user.role == User.Role.MAESTRO_APOYO.value:
            return queryset.filter(profesor=user, activo=True)

        # CASO 2: Administrador (Todos los activos)
        if user.role == User.Role.ADMINISTRADOR.value:
            return queryset.filter(activo=True)

        # Por defecto (seguridad extra), retorna vacío
        return queryset.none()

    def perform_create(self, serializer):
        """
        Al crear, si es Maestro de Apoyo, se asigna automáticamente como profesor.
        """
        user = self.request.user
        if user.role == User.Role.MAESTRO_APOYO.value:
            serializer.save(profesor=user)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Manejo de errores al eliminar (ProtectedError).
        """
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": "No se puede eliminar el alumno porque tiene registros asociados (ej. asistencias, expedientes)."},
                status=status.HTTP_400_BAD_REQUEST
            )