# avisos/views.py
from rest_framework import filters, permissions, viewsets

from .models import Anuncio
from .serializers import AnuncioSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso custom:
    - Ver (GET): Cualquier usuario autenticado.
    - Crear (POST): Solo Admin o Secretario.
    - Editar/Borrar (PUT/DELETE): Solo el autor o un admin.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        # Solo Admin o Secretario pueden crear anuncios
        return request.user.is_superuser or getattr(request.user, "role", "") in [
            "ADMIN",
            "SECRETARIO",
        ]

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
    search_fields = ["titulo", "contenido"]
    ordering_fields = ["fecha_publicacion"]

    def get_queryset(self):
        """
        Replica la lógica de tu AnuncioListView:
        Mostrar solo activos (no expirados + fecha_pub <= hoy).
        EXCEPCIÓN: Si eres el autor o admin, ves todo (para poder editar/borrar).
        """
        user = self.request.user

        # Si el usuario quiere ver "sus" anuncios para gestionarlos, devolvemos todo
        if self.action in ["update", "partial_update", "destroy"] or self.request.query_params.get(
            "mis_anuncios"
        ):
            if user.is_superuser:
                return Anuncio.objects.all().select_related("autor")
            return Anuncio.objects.de_autor(user).select_related("autor")

        # Para el listado general (tablón), aplicamos el filtro de vigencia
        return Anuncio.objects.vigentes().select_related("autor").order_by("-fecha_publicacion")

    def perform_create(self, serializer):
        """Asigna automáticamente el autor al crear."""
        serializer.save(autor=self.request.user)
