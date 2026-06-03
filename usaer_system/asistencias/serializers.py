from rest_framework import serializers

from .models import Asistencia


class ChecadorInputSerializer(serializers.Serializer):
    """
    Serializer simple para recibir el código en el kiosco.
    """

    numero_empleado = serializers.CharField(max_length=20, required=True)


class AsistenciaSerializer(serializers.ModelSerializer):
    """
    Para listar el historial de asistencias.
    """

    profesor_nombre = serializers.ReadOnlyField(source="profesor.get_full_name")
    escuela_nombre = serializers.ReadOnlyField(source="escuela.nombre")

    # Formato de horas para que sea legible (HH:MM:SS)
    hora_entrada = serializers.TimeField(format="%H:%M:%S", read_only=True)
    hora_salida = serializers.TimeField(format="%H:%M:%S", read_only=True)

    class Meta:
        model = Asistencia
        fields = [
            "id",
            "profesor",
            "profesor_nombre",
            "escuela",
            "escuela_nombre",
            "fecha",
            "presente",
            "hora_entrada",
            "hora_salida",
        ]
