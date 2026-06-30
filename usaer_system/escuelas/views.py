from django.db.models import ProtectedError
from rest_framework import filters, status, viewsets
from rest_framework.response import Response
from services.error_handling import error_400, error_500

from .models import Escuela
from .permissions import IsAdminOrSecretarioOrReadOnly
from .serializers import EscuelaSerializer


class EscuelaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Escuelas.
    - LISTAR (GET): Accesible para todos los usuarios logueados (para llenar selects).
    - CREAR/EDITAR/BORRAR: Solo Admin y Secretario.
    """

    queryset = Escuela.objects.all().order_by("nombre")
    serializer_class = EscuelaSerializer
    permission_classes = [IsAdminOrSecretarioOrReadOnly]
    throttle_scope = "sensitive_action"

    # Configuración de Búsqueda (Replica tu lógica de 'q')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    # Agregamos los campos exactos que tenías en tu 'filter(Q(...))'
    search_fields = ["nombre", "cct", "clave_estatal", "zona"]

    ordering_fields = ["nombre", "zona", "nivel"]

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
            return error_400(
                f"No se puede eliminar la escuela '{instance.nombre}' porque tiene registros asociados (alumnos, personal, etc.)."
            )
        except Exception as e:
            return error_500(f"Error inesperado al eliminar: {str(e)}")
