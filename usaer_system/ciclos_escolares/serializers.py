# ciclos_escolares/serializers.py
from rest_framework import serializers

from .models import CicloEscolar


class CicloEscolarSerializer(serializers.ModelSerializer):
    class Meta:
        model = CicloEscolar
        fields = "__all__"

    def validate(self, data):
        """Validar que fecha inicio < fecha fin"""
        if data.get("fecha_inicio") and data.get("fecha_fin"):
            if data["fecha_inicio"] > data["fecha_fin"]:
                raise serializers.ValidationError(
                    "La fecha de inicio no puede ser mayor a la fecha de fin."
                )
        return data


class PromocionPreviewSerializer(serializers.Serializer):
    """
    Serializer de solo lectura para mostrar el resultado de la simulación.
    No guarda nada en BD, solo estructura la respuesta JSON.
    """

    total_activos = serializers.IntegerField()
    a_promover_count = serializers.IntegerField()
    a_graduar_count = serializers.IntegerField()
    errores_count = serializers.IntegerField()

    # Listas de detalles (opcional, si quieres mostrar nombres en el frontend)
    detalles_promover = serializers.ListField(child=serializers.CharField(), required=False)
    detalles_graduar = serializers.ListField(child=serializers.CharField(), required=False)
    detalles_errores = serializers.ListField(child=serializers.CharField(), required=False)
