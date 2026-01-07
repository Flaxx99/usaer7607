from rest_framework import serializers
from django.utils import timezone
from .models import Permiso

class PermisoSerializer(serializers.ModelSerializer):
    # Campos de lectura para el Frontend
    profesor_nombre = serializers.ReadOnlyField(source='profesor.get_full_name')
    escuela_nombre = serializers.ReadOnlyField(source='escuela.nombre')
    administrador_nombre = serializers.ReadOnlyField(source='administrador.get_full_name')
    
    # Formatos de fecha y hora
    fecha_solicitud = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    fecha_respuesta = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    duracion_dias = serializers.ReadOnlyField()

    class Meta:
        model = Permiso
        fields = [
            'id', 
            'tipo', 
            'fecha_inicio', 
            'fecha_fin', 
            'horas_solicitadas', 
            'motivo',
            'estado', 
            'respuesta_admin', 
            'profesor', 
            'profesor_nombre',
            'escuela', 
            'escuela_nombre',
            'administrador_nombre',
            'fecha_solicitud', 
            'fecha_respuesta',
            'duracion_dias'
        ]
        read_only_fields = ['profesor', 'escuela', 'estado', 'respuesta_admin', 'fecha_solicitud', 'fecha_respuesta']

    def validate(self, data):
        """
        Validaciones conjuntas (fechas y mayúsculas).
        """
        # 1. Conversión a Mayúsculas (Replica forms.py)
        if 'motivo' in data and isinstance(data['motivo'], str):
            data['motivo'] = data['motivo'].upper()
        
        # 2. Validaciones de Fecha (Solo si estamos creando o actualizando fechas)
        fecha_inicio = data.get('fecha_inicio') or self.instance.fecha_inicio if self.instance else data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin') or self.instance.fecha_fin if self.instance else data.get('fecha_fin')

        if fecha_inicio and fecha_fin:
            # A. Fecha fin no puede ser menor a inicio
            if fecha_fin < fecha_inicio:
                raise serializers.ValidationError({"fecha_fin": "La fecha de fin no puede ser anterior a la fecha de inicio."})

            # B. Duración máxima de 30 días
            if (fecha_fin - fecha_inicio).days > 30:
                raise serializers.ValidationError("No se pueden solicitar más de 30 días de permiso consecutivos.")

        return data