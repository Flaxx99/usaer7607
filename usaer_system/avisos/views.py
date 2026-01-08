# avisos/views.py
from rest_framework import viewsets, permissions, filters
from django.db.models import Q
from django.utils import timezone
from .models import Anuncio
from .serializers import AnuncioSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso custom:
    - Cualquiera logueado puede ver (GET).
    - Solo el autor o un admin puede editar/borrar.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.autor == request.user or request.user.is_superuser

class AnuncioViewSet(viewsets.ModelViewSet):
    """
    API para Tablón de Anuncios.
    - Lista solo anuncios vigentes (públicos).
    - El autor puede ver sus propios anuncios aunque hayan expirado.
    """
    queryset = Anuncio.objects.all()
    serializer_class = AnuncioSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'contenido']
    ordering_fields = ['fecha_publicacion']

    def get_queryset(self):
        """
        Replica la lógica de tu AnuncioListView:
        Mostrar solo activos (no expirados + fecha_pub <= hoy).
        EXCEPCIÓN: Si eres el autor o admin, ves todo (para poder editar/borrar).
        """
        user = self.request.user
        now = timezone.now()

        # Si el usuario quiere ver "sus" anuncios para gestionarlos, devolvemos todo
        if self.action in ['update', 'partial_update', 'destroy'] or self.request.query_params.get('mis_anuncios'):
            if user.is_superuser:
                return Anuncio.objects.all()
            return Anuncio.objects.filter(autor=user)

        # Para el listado general (tablón), aplicamos el filtro de vigencia
        return Anuncio.objects.filter(
            (Q(fecha_expiracion__gte=now) | Q(fecha_expiracion__isnull=True)),
            fecha_publicacion__lte=now
        ).order_by('-fecha_publicacion')

    def perform_create(self, serializer):
        """Asigna automáticamente el autor al crear."""
        serializer.save(autor=self.request.user)