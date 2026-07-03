# rae/serializers.py
from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from rest_framework import serializers

from .models import RAEAlumno, RegistroRAE


class RAEAlumnoSerializer(serializers.ModelSerializer):
    alumno_nombre = serializers.ReadOnlyField(source="alumno.get_full_name")

    class Meta:
        model = RAEAlumno
        fields = "__all__"
        read_only_fields = ["registro", "capturado_por", "curp", "genero", "edad", "grado"]


class RegistroRAESerializer(serializers.ModelSerializer):
    escuela_nombre = serializers.ReadOnlyField(source="escuela.nombre")
    ciclo_nombre = serializers.ReadOnlyField(source="ciclo_escolar.nombre")
    creado_por_nombre = serializers.ReadOnlyField(source="creado_por.get_full_name")

    # Opcional: Incluir alumnos anidados para ver el detalle en el GET del registro
    # detalles_alumnos = RAEAlumnoSerializer(many=True, read_only=True)

    class Meta:
        model = RegistroRAE
        fields = "__all__"
        read_only_fields = ["fecha_creacion", "creado_por", "ciclo_escolar"]

    def create(self, validated_data):
        # Asignar ciclo actual y usuario automáticamente
        try:
            validated_data["ciclo_escolar"] = get_current_ciclo_escolar_instance()
        except Exception:
            raise serializers.ValidationError("No hay ciclo escolar activo.")

        validated_data["creado_por"] = self.context["request"].user
        return super().create(validated_data)


class BulkRAESaveSerializer(serializers.Serializer):
    """
    Serializer especial para validar la carga masiva de alumnos.
    """

    registro_id = serializers.IntegerField()
    version = serializers.IntegerField(
        required=True, help_text="Versión actual del registro para bloqueo optimista"
    )
    alumnos = serializers.ListField(child=serializers.DictField())
