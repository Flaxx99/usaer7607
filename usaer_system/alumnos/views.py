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
    permission_classes = [IsMaestroOAdmin]
    
    # Configuración de búsqueda
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombres', 'apellido_paterno', 'apellido_materno', 'curp']
    ordering_fields = ['apellido_paterno', 'nombres']
    ordering = ['apellido_paterno', 'nombres']

    def get_queryset(self):
        """
        Lógica de filtrado según el rol.
        """
        user = self.request.user
        
        # Optimizamos consultas
        queryset = Alumno.objects.select_related('escuela', 'profesor')

        # Si es Superusuario, ve todo
        if user.is_superuser:
            return queryset

        # CASO 1: Maestro de Apoyo (Solo sus alumnos activos)
        if user.role == User.Role.MAESTRO_APOYO.value:
            return queryset.filter(profesor=user, activo=True)

        # CASO 2: Administrador / Director (Todos los activos)
        if user.role in [User.Role.ADMINISTRADOR.value, User.Role.DIRECTOR.value]:
            return queryset.filter(activo=True)

        # Por defecto retorna vacío
        return queryset.none()

    def perform_create(self, serializer):
        """
        Lógica de asignación de profesor:
        1. Si el frontend manda un ID en 'profesor', se respeta (Admin asignando a Maestro).
        2. Si no manda nada y el usuario es MAESTRO_APOYO, se auto-asigna.
        """
        user = self.request.user
        
        # Obtenemos el dato crudo del request
        profesor_id = self.request.data.get('profesor')

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
                {"detail": "No se puede eliminar el alumno porque tiene registros asociados (ej. asistencias, expedientes)."},
                status=status.HTTP_400_BAD_REQUEST
            )