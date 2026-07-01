# usaer_system/calendario/views.py
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import filters, permissions, viewsets

from .models import EventoCalendario
from .serializers import EventoCalendarioSerializer

User = get_user_model()


class IsEventoOwnerOrInstitutionalAdmin(permissions.BasePermission):
    """
    Reglas de seguridad:
    - Ver (GET):
        - Si es INSTITUCIONAL: Todos pueden ver.
        - Si es PERSONAL: Solo el creador puede ver.
    - Editar/Borrar (PUT/DELETE):
        - Si es PERSONAL: Solo el creador.
        - Si es INSTITUCIONAL: Solo Admin o Secretario.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # 1. Lectura
        if request.method in permissions.SAFE_METHODS:
            if obj.tipo == "INSTITUCIONAL":
                return True
            return obj.creado_por == user

        # 2. Escritura
        if obj.tipo == "PERSONAL":
            return obj.creado_por == user

        # Si es institucional, solo Staff o Secretario
        if obj.tipo == "INSTITUCIONAL":
            return user.is_staff or (getattr(user, "role", "") == "SECRETARIO")

        return False


class EventoCalendarioViewSet(viewsets.ModelViewSet):
    serializer_class = EventoCalendarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsEventoOwnerOrInstitutionalAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ["titulo", "descripcion"]

    def get_queryset(self):
        """
        Filtra qué eventos ve el usuario.
        - Ve todos los INSTITUCIONALES.
        - Ve sus propios PERSONALES.
        """
        user = self.request.user
        return (
            EventoCalendario.objects.filter(
                Q(tipo="INSTITUCIONAL") | Q(tipo="PERSONAL", creado_por=user)
            )
            .select_related("creado_por")
            .order_by("-fecha_inicio")
        )

    def perform_create(self, serializer):
        """
        Al crear:
        - Admin/Secretario → tipo='INSTITUCIONAL' (el frontend no envía tipo)
        - Maestro normal → tipo='PERSONAL' (forzado)
        El creador se asigna automáticamente en el serializer.
        """
        if self.request.user.is_staff or getattr(self.request.user, "role", "") == "SECRETARIO":
            serializer.save(tipo="INSTITUCIONAL")
        else:
            serializer.save(tipo="PERSONAL")
