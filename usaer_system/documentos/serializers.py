from rest_framework import serializers
from .models import Expediente, OtroArchivo
from alumnos.models import Alumno

class OtroArchivoSerializer(serializers.ModelSerializer):
    """
    Serializer para leer los archivos adjuntos.
    """
    url_archivo = serializers.SerializerMethodField()
    nombre_archivo = serializers.SerializerMethodField()

    class Meta:
        model = OtroArchivo
        fields = ['id', 'archivo', 'descripcion', 'url_archivo', 'nombre_archivo']
        read_only_fields = ['id']

    def get_url_archivo(self, obj):
        if obj.archivo:
            return obj.archivo.url
        return None

    def get_nombre_archivo(self, obj):
        return str(obj)

class ExpedienteSerializer(serializers.ModelSerializer):
    # Campos de lectura (ReadOnly)
    alumno_nombre = serializers.ReadOnlyField(source='alumno.get_full_name')
    profesor_nombre = serializers.ReadOnlyField(source='profesor.get_full_name')
    escuela_nombre = serializers.ReadOnlyField(source='alumno.escuela.nombre')
    
    # Nested Serializer para LEER los archivos extra existentes
    otros_archivos = OtroArchivoSerializer(many=True, read_only=True)
    
    # Campos especiales para SUBIR archivos extra (WriteOnly)
    # React enviará esto en un FormData.
    nuevos_archivos_extra = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    nuevos_archivos_descripciones = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        write_only=True,
        required=False
    )

    class Meta:
        model = Expediente
        fields = [
            'id', 
            'alumno', 'alumno_nombre',
            'profesor', 'profesor_nombre',
            'escuela_nombre',
            'informe_deteccion', 
            'informe_psicopedagogico', 
            'plan_intervencion', 
            'observaciones', 
            'fecha_subida',
            'otros_archivos',
            'nuevos_archivos_extra',
            'nuevos_archivos_descripciones'
        ]
        read_only_fields = ['profesor', 'fecha_subida']

    def validate(self, data):
        """
        1. Convertir observaciones a Mayúsculas.
        2. Validar duplicados de alumno (solo al crear).
        """
        # Convertir a mayúsculas
        if 'observaciones' in data and isinstance(data['observaciones'], str):
            data['observaciones'] = data['observaciones'].upper()

        # Validar duplicados solo en creación
        if not self.instance:
            alumno = data.get('alumno')
            if alumno and Expediente.objects.filter(alumno=alumno).exists():
                raise serializers.ValidationError({"alumno": f"El alumno {alumno.get_full_name()} ya tiene un expediente activo."})
        
        return data

    def create(self, validated_data):
        # Extraer archivos extra
        archivos_data = validated_data.pop('nuevos_archivos_extra', [])
        descripciones_data = validated_data.pop('nuevos_archivos_descripciones', [])
        
        # Crear Expediente
        expediente = Expediente.objects.create(**validated_data)

        # Crear OtrosArchivos
        for i, archivo in enumerate(archivos_data):
            desc = descripciones_data[i] if i < len(descripciones_data) else ""
            if desc: desc = desc.upper() # Mayúsculas también aquí
            OtroArchivo.objects.create(expediente=expediente, archivo=archivo, descripcion=desc)
        
        return expediente

    def update(self, instance, validated_data):
        archivos_data = validated_data.pop('nuevos_archivos_extra', [])
        descripciones_data = validated_data.pop('nuevos_archivos_descripciones', [])

        # Actualizar campos del expediente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Agregar nuevos archivos extra (sin borrar los anteriores)
        for i, archivo in enumerate(archivos_data):
            desc = descripciones_data[i] if i < len(descripciones_data) else ""
            if desc: desc = desc.upper()
            OtroArchivo.objects.create(expediente=instance, archivo=archivo, descripcion=desc)

        return instance