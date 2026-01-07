from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.db.models import ProtectedError

from .models import Escuela
from .serializers import EscuelaSerializer
from .permissions import IsAdminOrSecretarioOrReadOnly

class EscuelaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Escuelas.
    - LISTAR (GET): Accesible para todos los usuarios logueados (para llenar selects).
    - CREAR/EDITAR/BORRAR: Solo Admin y Secretario.
    """
    queryset = Escuela.objects.all().order_by('nombre')
    serializer_class = EscuelaSerializer
    permission_classes = [IsAdminOrSecretarioOrReadOnly]
    
    # Configuración de Búsqueda (Replica tu lógica de 'q')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    # Agregamos los campos exactos que tenías en tu 'filter(Q(...))'
    search_fields = ['nombre', 'cct', 'clave_estatal', 'zona'] 
    
    ordering_fields = ['nombre', 'zona', 'nivel']

    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribimos el método destroy para manejar errores de integridad
        (Ej. No borrar una escuela si tiene alumnos o maestros asignados).
        """
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": f"No se puede eliminar la escuela '{instance.nombre}' porque tiene registros asociados (alumnos, personal, etc.)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Error inesperado al eliminar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )