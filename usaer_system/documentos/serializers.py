# documentos/serializers.py
from rest_framework import serializers
from .models import Expediente, OtroArchivo
from pathlib import Path

EXTENSIONES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls']
TAMANO_MAXIMO = 50 * 1024 * 1024  # 50 MB


def validar_archivo(archivo):
    """Valida extensión y tamaño de un archivo subido."""
    if not archivo:
        return
    ext = Path(archivo.name).suffix.lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        raise serializers.ValidationError(
            f"Extensión no permitida: {archivo.name}. Permitidas: {', '.join(EXTENSIONES_PERMITIDAS)}"
        )
    if archivo.size > TAMANO_MAXIMO:
        raise serializers.ValidationError(f"{archivo.name} excede el límite de 50MB.")

class OtroArchivoSerializer(serializers.ModelSerializer):
    # Definimos explícitamente los campos calculados para que DRF sepa cómo llenarlos
    url_archivo = serializers.SerializerMethodField()
    nombre_archivo = serializers.SerializerMethodField()

    class Meta:
        model = OtroArchivo
        fields = ['id', 'archivo', 'descripcion', 'url_archivo', 'nombre_archivo']
        read_only_fields = ['id']

    def validate_archivo(self, value):
        validar_archivo(value)
        return value

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

    def validate(self, data):
        """Valida extensiones y tamaño de archivos subidos."""
        # Validar los 3 archivos principales del expediente
        for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
            archivo = data.get(field)
            if archivo:
                validar_archivo(archivo)

        # Validar archivos extra
        archivos_extra = data.get('nuevos_archivos_extra', [])
        for archivo in archivos_extra:
            validar_archivo(archivo)

        # Mayúsculas en observaciones (como el original)
        if 'observaciones' in data and isinstance(data['observaciones'], str):
            data['observaciones'] = data['observaciones'].upper()

        return data

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