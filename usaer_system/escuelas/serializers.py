from rest_framework import serializers

from .models import Escuela


class EscuelaSimpleSerializer(serializers.ModelSerializer):
    """Serializer ligero para mostrar info básica de la escuela como nested object."""

    class Meta:
        model = Escuela
        fields = ["id", "nombre", "clave_estatal", "nivel", "zona"]


class EscuelaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escuela
        fields = "__all__"

    def validate(self, data):
        """
        Replica la lógica de 'convertir_mayusculas' del forms.py original.
        Convierte a MAYÚSCULAS todos los campos de texto excepto los correos.
        """
        campos_excluidos = ["correo_inspector", "correo_director"]

        for field, value in data.items():
            if isinstance(value, str) and field not in campos_excluidos:
                data[field] = value.upper()

        return data
