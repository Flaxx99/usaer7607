# calendario/serializers.py
from rest_framework import serializers
from .models import EventoCalendario

class EventoCalendarioSerializer(serializers.ModelSerializer):
    # Campos extra para compatibilidad con librerías de calendario
    title = serializers.CharField(source='titulo', read_only=True)
    start = serializers.DateTimeField(source='fecha_inicio', read_only=True)
    end = serializers.DateTimeField(source='fecha_fin', read_only=True)
    
    # Mostrar nombre del creador
    creado_por_nombre = serializers.ReadOnlyField(source='creado_por.get_full_name')

    class Meta:
        model = EventoCalendario
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 
            'tipo', 'archivo', 'creado_por', 'creado_por_nombre',
            'title', 'start', 'end'
        ]
        read_only_fields = ['creado_por']

    def validate(self, data):
        """Validar que fecha inicio <= fecha fin"""
        inicio = data.get('fecha_inicio')
        fin = data.get('fecha_fin')
        
        # Si es update parcial, obtenemos valores de la instancia si faltan
        if self.instance:
            inicio = inicio or self.instance.fecha_inicio
            fin = fin or self.instance.fecha_fin
            
        if inicio and fin and inicio > fin:
            raise serializers.ValidationError({
                "fecha_fin": "La fecha de fin no puede ser anterior a la de inicio."
            })
        return data