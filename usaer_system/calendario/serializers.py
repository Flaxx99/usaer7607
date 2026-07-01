# calendario/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import EventoCalendario

User = get_user_model()


class EventoCalendarioSerializer(serializers.ModelSerializer):
    # ─── Alias: nombres ingleses (frontend) → nombres del modelo ───
    title = serializers.CharField(source="titulo")
    description = serializers.CharField(source="descripcion", required=False, allow_blank=True)
    start_time = serializers.DateTimeField(source="fecha_inicio")
    end_time = serializers.DateTimeField(source="fecha_fin")
    created_by = serializers.PrimaryKeyRelatedField(source="creado_por", read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    # ─── ReadOnly: nombres mostrables ───
    created_by_nombre = serializers.ReadOnlyField(source="creado_por.get_full_name")
    assigned_to_nombre = serializers.ReadOnlyField(source="assigned_to.get_full_name", default=None)
    alumno_nombre = serializers.ReadOnlyField(source="alumno.get_full_name", default=None)
    escuela_nombre = serializers.ReadOnlyField(source="escuela.nombre", default=None)

    # ─── Aliats legacy (para no romper integraciones externas) ───
    start = serializers.DateTimeField(source="fecha_inicio", read_only=True)
    end = serializers.DateTimeField(source="fecha_fin", read_only=True)

    class Meta:
        model = EventoCalendario
        fields = [
            # Canonical (frontend)
            "id",
            "title",
            "description",
            "start_time",
            "end_time",
            "event_type",
            "status",
            "priority",
            "color",
            "created_by",
            "created_by_nombre",
            "assigned_to",
            "assigned_to_nombre",
            "alumno",
            "alumno_nombre",
            "escuela",
            "escuela_nombre",
            # Legacy (backward compat)
            "start",
            "end",
        ]
        read_only_fields = ["creado_por", "created_by"]

    def validate(self, data):
        """Validar que start_time <= end_time"""
        inicio = data.get("fecha_inicio") or data.get("start_time")
        fin = data.get("fecha_fin") or data.get("end_time")

        if self.instance:
            inicio = inicio or self.instance.fecha_inicio
            fin = fin or self.instance.fecha_fin

        if inicio and fin and inicio > fin:
            raise serializers.ValidationError(
                {"end_time": "La fecha de fin no puede ser anterior a la de inicio."}
            )
        return data

    def create(self, validated_data):
        validated_data["creado_por"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "creado_por" in validated_data:
            del validated_data["creado_por"]
        return super().update(instance, validated_data)
