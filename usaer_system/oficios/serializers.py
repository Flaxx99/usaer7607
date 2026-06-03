# oficios/serializers.py
from rest_framework import serializers

from .models import Oficio


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
