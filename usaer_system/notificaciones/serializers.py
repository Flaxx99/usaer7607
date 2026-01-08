# notificaciones/serializers.py
from rest_framework import serializers
from .models import Notificacion

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ['id', 'mensaje', 'leida', 'fecha_creacion', 'url']
        # Protegemos todo para que el usuario no edite el texto o la fecha
        read_only_fields = ['id', 'mensaje', 'fecha_creacion', 'url', 'usuario']