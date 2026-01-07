from rest_framework import serializers
from .models import Alumno

class AlumnoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField(source='get_full_name')
    edad = serializers.IntegerField(read_only=True)
    
    # Campos opcionales para desplegar nombres en lugar de IDs en las respuestas GET
    escuela_nombre = serializers.ReadOnlyField(source='escuela.nombre')
    profesor_nombre = serializers.ReadOnlyField(source='profesor.get_full_name')

    class Meta:
        model = Alumno
        fields = [
            'id', 'profesor', 'profesor_nombre',
            'escuela', 'escuela_nombre',
            'apellido_paterno', 'apellido_materno', 'nombres', 'nombre_completo',
            'curp', 'fecha_nacimiento', 'sexo', 'edad',
            'grado', 'grupo',
            'activo', 'clasificacion', 'clasificacion_otro'
        ]

    def validate(self, data):
        """
        Replica la validación 'clean()' de tu forms.py original.
        """
        clasificacion = data.get('clasificacion')
        clasificacion_otro = data.get('clasificacion_otro')

        # Regla 1: Si elige "OTRO", debe especificar cuál
        if clasificacion == 'OTRO' and not clasificacion_otro:
            raise serializers.ValidationError({
                "clasificacion_otro": "Este campo es requerido cuando la clasificación es 'Otro'."
            })
        
        # Regla 2: Si NO elige "OTRO", limpiamos el campo de especificación
        if clasificacion != 'OTRO' and clasificacion_otro:
            data['clasificacion_otro'] = ''
            
        return data