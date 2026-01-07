from rest_framework import serializers
from .models import Incidencia

class IncidenciaSerializer(serializers.ModelSerializer):
    # Campos de lectura (ReadOnly) para mostrar nombres en lugar de IDs en el Frontend
    escuela_nombre = serializers.ReadOnlyField(source='escuela.nombre')
    profesor_nombre = serializers.ReadOnlyField(source='profesor.get_full_name')
    reportado_por_nombre = serializers.ReadOnlyField(source='reportado_por.get_full_name')
    
    # Formato de fecha legible (Ej: "2023-10-25 14:30")
    fecha_reporte = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    fecha_resolucion = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Incidencia
        fields = [
            'id', 
            'titulo', 
            'descripcion', 
            'escuela', 
            'escuela_nombre',
            'profesor',          # ID del profesor involucrado (Input)
            'profesor_nombre',   # Nombre del profesor (Output)
            'reportado_por',     # ID del creador (Output - manejado por backend)
            'reportado_por_nombre',
            'estado', 
            'respuesta_admin', 
            'fecha_reporte', 
            'fecha_resolucion'
        ]
        # Estos campos NO se deben poder editar directamente desde la API
        read_only_fields = ['reportado_por', 'fecha_resolucion', 'fecha_reporte']

    def validate(self, data):
        """
        Replica la lógica de 'convertir_mayusculas' del forms.py original.
        Convierte a MAYÚSCULAS el título, descripción y respuesta.
        """
        campos_texto = ['titulo', 'descripcion', 'respuesta_admin']
        
        for campo in campos_texto:
            if campo in data and isinstance(data[campo], str):
                data[campo] = data[campo].upper()
        
        return data