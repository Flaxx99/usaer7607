from rest_framework import serializers

from .models import Incidencia


class IncidenciaSerializer(serializers.ModelSerializer):
    # ReadOnly fields to show names instead of IDs in the Frontend
    escuela_nombre = serializers.ReadOnlyField(source="escuela.nombre")
    profesor_nombre = serializers.ReadOnlyField(source="profesor.get_full_name")
    reportado_por_nombre = serializers.ReadOnlyField(source="reportado_por.get_full_name")

    # Readable date format (e.g., "2023-10-25 14:30")
    fecha_reporte = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    fecha_resolucion = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Incidencia
        fields = [
            "id",
            "titulo",
            "descripcion",
            "escuela",
            "escuela_nombre",
            "profesor",  # ID of the involved professor (Input)
            "profesor_nombre",  # Name of the professor (Output)
            "reportado_por",  # ID of the creator (Output - handled by backend)
            "reportado_por_nombre",
            "estado",
            "respuesta_admin",
            "fecha_reporte",
            "fecha_resolucion",
        ]
        # These fields MUST NOT be editable directly from the API
        # Added 'escuela' here so the Admin doesn't need to send it manually
        read_only_fields = ["reportado_por", "fecha_resolucion", "fecha_reporte", "escuela"]

    def validate(self, data):
        """
        Replicates the logic of 'convertir_mayusculas'.
        Converts title, description, and response to UPPERCASE.
        """
        text_fields = ["titulo", "descripcion", "respuesta_admin"]

        for field in text_fields:
            if field in data and isinstance(data[field], str):
                data[field] = data[field].upper()

        return data
