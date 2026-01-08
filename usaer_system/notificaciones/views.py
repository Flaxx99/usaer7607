# notificaciones/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notificacion
from .serializers import NotificacionSerializer

class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API para listar y gestionar notificaciones.
    - El usuario solo ve SUS propias notificaciones.
    - No puede crear ni borrar, solo marcar como leídas.
    """
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtra para mostrar solo las notificaciones del usuario logueado."""
        return Notificacion.objects.filter(
            usuario=self.request.user
        ).order_by('-fecha_creacion')

    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """
        Endpoint rápido para el dashboard/navbar.
        Devuelve solo el conteo y la lista de las no leídas.
        URL: /api/notificaciones/no_leidas/
        """
        qs = self.get_queryset().filter(leida=False)
        # Paginamos si son muchas, o devolvemos las primeras 5 para el popup
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response({
            'count': qs.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def conteo(self, request):
        """
        Endpoint ultra-ligero solo para el badge (numerito rojo).
        URL: /api/notificaciones/conteo/
        """
        count = self.get_queryset().filter(leida=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """
        Marca una notificación específica como leída.
        URL: /api/notificaciones/{id}/marcar_leida/
        """
        notificacion = self.get_object()
        if not notificacion.leida:
            notificacion.leida = True
            notificacion.save()
        return Response({'status': 'marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """
        Marca TODAS las notificaciones del usuario como leídas.
        URL: /api/notificaciones/marcar_todas_leidas/
        """
        self.get_queryset().filter(leida=False).update(leida=True)
        return Response({'status': 'all marked as read'}, status=status.HTTP_200_OK)