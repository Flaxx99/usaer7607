from rest_framework import viewsets, permissions, filters
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema 

from .models import Oficio
from .serializers import OficioSerializer
from .permissions import IsAdminOrSecretarioOrReadOnly

class OficioViewSet(viewsets.ModelViewSet):
    queryset = Oficio.objects.all().select_related('subido_por').order_by('-fecha_subida')
    serializer_class = OficioSerializer
    permission_classes = [IsAdminOrSecretarioOrReadOnly]
    
    # Habilitamos soporte para subir archivos
    parser_classes = (MultiPartParser, FormParser)
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_subida', 'titulo']

    def perform_create(self, serializer):
        # Asignamos automáticamente el usuario que sube el archivo
        serializer.save(subido_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    # --- ZONA DE SEGURIDAD SWAGGER ---
    # Sobrescribimos estos métodos y les ponemos 'auto_schema=None'
    # para que Swagger NO intente inspeccionarlos y no explote con el archivo adjunto.
    # La API sigue funcionando, solo que estos botones no saldrán en la documentación.

    @swagger_auto_schema(auto_schema=None)
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(auto_schema=None)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(auto_schema=None)
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)