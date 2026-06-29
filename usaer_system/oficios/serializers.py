# oficios/serializers.py
from pathlib import Path

from rest_framework import serializers

from .models import Oficio

EXTENSIONES_PERMITIDAS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xlsx", ".xls"]
TAMANO_MAXIMO = 50 * 1024 * 1024  # 50 MB


def validar_archivo(value):
    """Valida extensión y tamaño de un archivo subido."""
    ext = Path(value.name).suffix.lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        raise serializers.ValidationError(
            f"Extensión no permitida: {value.name}. Permitidas: {', '.join(EXTENSIONES_PERMITIDAS)}"
        )
    if value.size > TAMANO_MAXIMO:
        raise serializers.ValidationError(f"{value.name} excede el límite de 50MB.")


class OficioSerializer(serializers.ModelSerializer):
    # Mostramos info legible del usuario
    subido_por_nombre = serializers.ReadOnlyField(source="subido_por.get_full_name")

    class Meta:
        model = Oficio
        fields = [
            "id",
            "titulo",
            "descripcion",
            "archivo",
            "fecha_subida",
            "subido_por",
            "subido_por_nombre",
        ]
        read_only_fields = ["subido_por", "fecha_subida"]  # El usuario se asigna en la vista

    def validate_archivo(self, value):
        validar_archivo(value)
        return value
