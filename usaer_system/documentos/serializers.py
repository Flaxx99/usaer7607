# documentos/serializers.py
from rest_framework import serializers
from .models import Expediente, OtroArchivo

class OtroArchivoSerializer(serializers.ModelSerializer):
    # Definimos explícitamente los campos calculados para que DRF sepa cómo llenarlos
    url_archivo = serializers.SerializerMethodField()
    nombre_archivo = serializers.SerializerMethodField()

    class Meta:
        model = OtroArchivo
        fields = ['id', 'archivo', 'descripcion', 'url_archivo', 'nombre_archivo']
        read_only_fields = ['id']

    def get_url_archivo(self, obj):
        if obj.archivo:
            try:
                return obj.archivo.url
            except ValueError:
                return None
        return None

    def get_nombre_archivo(self, obj):
        if obj.archivo:
            # Devuelve solo el nombre del archivo, quitando la ruta
            return obj.archivo.name.split('/')[-1]
        return None

class ExpedienteSerializer(serializers.ModelSerializer):
    # Campos de lectura para mostrar info útil en el frontend
    alumno_nombre = serializers.ReadOnlyField(source='alumno.get_full_name')
    profesor_nombre = serializers.ReadOnlyField(source='profesor.get_full_name')
    
    # Nested serializer para ver los archivos extra existentes
    otros_archivos = OtroArchivoSerializer(many=True, read_only=True)

    # Campos de escritura para subir archivos extra (Listas)
    # Se definen como write_only para que no den problemas al leer
    nuevos_archivos_extra = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="Lista de archivos para subir como anexos"
    )
    nuevos_archivos_descripciones = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        write_only=True,
        required=False,
        help_text="Lista de descripciones correspondientes a los archivos extra"
    )

    class Meta:
        model = Expediente
        fields = '__all__'
        read_only_fields = ['profesor', 'fecha_subida', 'otros_archivos']

    def create(self, validated_data):
        # 1. Sacamos los datos que no son del modelo Expediente
        archivos_data = validated_data.pop('nuevos_archivos_extra', [])
        descripciones_data = validated_data.pop('nuevos_archivos_descripciones', [])
        
        # 2. Creamos el Expediente
        expediente = super().create(validated_data)
        
        # 3. Creamos los archivos extra relacionados
        for i, archivo in enumerate(archivos_data):
            desc = descripciones_data[i] if i < len(descripciones_data) else ""
            OtroArchivo.objects.create(
                expediente=expediente,
                archivo=archivo,
                descripcion=desc
            )
        return expediente

    def update(self, instance, validated_data):
        # 1. Sacamos los datos de archivos extra
        archivos_data = validated_data.pop('nuevos_archivos_extra', [])
        descripciones_data = validated_data.pop('nuevos_archivos_descripciones', [])
        
        # 2. Actualizamos el Expediente base
        expediente = super().update(instance, validated_data)
        
        # 3. Agregamos los NUEVOS archivos extra (sin borrar los anteriores)
        for i, archivo in enumerate(archivos_data):
            desc = descripciones_data[i] if i < len(descripciones_data) else ""
            OtroArchivo.objects.create(
                expediente=expediente,
                archivo=archivo,
                descripcion=desc
            )
        return expediente