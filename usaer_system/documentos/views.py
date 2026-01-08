# documentos/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema  # <--- Import necesario

from .models import Expediente, OtroArchivo
from .serializers import ExpedienteSerializer
from .permissions import ExpedientePermission

User = get_user_model()

class ExpedienteViewSet(viewsets.ModelViewSet):
    serializer_class = ExpedienteSerializer
    permission_classes = [ExpedientePermission]
    
    # Habilitamos soporte para subir archivos (Multipart)
    parser_classes = (MultiPartParser, FormParser)
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['alumno__nombres', 'alumno__apellido_paterno', 'alumno__curp', 'observaciones']
    ordering_fields = ['fecha_subida', 'alumno__apellido_paterno']
    ordering = ['-fecha_subida']

    def get_queryset(self):
        user = self.request.user
        # Optimizamos queries
        qs = Expediente.objects.select_related('alumno', 'profesor', 'alumno__escuela').prefetch_related('otros_archivos')

        # 1. Admin/Secretario: Ven Todo
        roles_full = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if user.is_superuser or user.role in roles_full:
            return qs

        # 2. Director: Ve todo lo de su escuela
        if user.role == User.Role.DIRECTOR.value:
             if user.escuela:
                 return qs.filter(alumno__escuela=user.escuela)
             return qs.none()

        # 3. Equipo Itinerante: Ve todo lo de su escuela
        roles_equipo = [
            User.Role.PSICOLOGO.value, User.Role.TRABAJADOR_SOCIAL.value, 
            User.Role.COMUNICACION.value, User.Role.PSICOMOTRICIDAD.value
        ]
        if user.role in roles_equipo:
            if user.escuela:
                return qs.filter(alumno__escuela=user.escuela)
            return qs.none()

        # 4. Maestro de Apoyo: Ve expedientes donde él es el dueño 
        #    O donde el alumno es suyo actualmente
        if user.role == User.Role.MAESTRO_APOYO.value:
            return qs.filter(Q(profesor=user) | Q(alumno__profesor=user))
        
        return qs.none()

    def perform_create(self, serializer):
        # Asignar profesor automáticamente
        serializer.save(profesor=self.request.user)

    @action(detail=True, methods=['delete'], url_path=r'eliminar-archivo-extra/(?P<archivo_id>\d+)')
    def eliminar_archivo_extra(self, request, pk=None, archivo_id=None):
        """
        Permite borrar un archivo adjunto específico sin borrar todo el expediente.
        """
        expediente = self.get_object() # Esto valida los permisos del expediente primero
        try:
            archivo_extra = OtroArchivo.objects.get(pk=archivo_id, expediente=expediente)
            archivo_extra.delete() 
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OtroArchivo.DoesNotExist:
            return Response({"detail": "Archivo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    # --- ZONA DE SEGURIDAD SWAGGER ---
    # Ocultamos estos métodos de la documentación para evitar el error "FileField is supported only in formData"
    # La API funciona igual, solo no aparecen estos botones en /swagger/

    @swagger_auto_schema(auto_schema=None)
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(auto_schema=None)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(auto_schema=None)
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)