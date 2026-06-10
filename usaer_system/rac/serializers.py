# rac/serializers.py

from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from .models import RegistroRAC


class RegistroRACSerializer(serializers.ModelSerializer):
    # Campos de lectura para mostrar info bonita en el frontend
    alumno_nombre = serializers.ReadOnlyField(source="alumno.get_full_name")
    escuela_nombre = serializers.ReadOnlyField(source="escuela_regular.nombre")
    maestro_nombre = serializers.ReadOnlyField(source="maestro_apoyo.get_full_name")
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)

    class Meta:
        model = RegistroRAC
        fields = "__all__"
        read_only_fields = [
            "fecha_registro",
            "ciclo_escolar",
            # Estos se autorrellenan desde el alumno, mejor que sean readonly en la API
            "zona_regular",
            "curp",
            "sexo",
            "edad",
            "grado",
        ]

    def validate(self, data):
        """
        Validaciones de negocio:
        1. Subclasificación válida para la clasificación.
        2. Unicidad por ciclo escolar (si es creación).
        """
        # 1. Validar Subclasificación
        clasificacion = data.get("clasificacion")
        sub = data.get("subclasificacion")

        # Mapa de validación (simplificado para el ejemplo)
        # Deberías importar CLASS_TO_SUB de tu forms.py o definirlo aquí
        from .models import APTITUDES_SUB, DIFICULTADES_SUB, DISCAPACIDAD_SUB, TRASTORNOS_SUB

        valid_map = {
            "DISCAPACIDAD": [c[0] for c in DISCAPACIDAD_SUB],
            "DIFICULTADES_SEVERAS": [c[0] for c in DIFICULTADES_SUB],
            "TRASTORNOS": [c[0] for c in TRASTORNOS_SUB],
            "APTITUDES_SOBRESALIENTES": [c[0] for c in APTITUDES_SUB],
        }

        opciones = valid_map.get(clasificacion, [])
        if opciones and sub not in opciones:
            raise serializers.ValidationError(
                {
                    "subclasificacion": f"La subclasificación '{sub}' no es válida para '{clasificacion}'."
                }
            )

        # 2. Validar Unicidad en el ciclo actual (Solo al crear)
        if not self.instance:
            try:
                ciclo_actual = get_current_ciclo_escolar_instance()
            except ObjectDoesNotExist:
                # Sin ciclo activo, no podemos validar duplicados
                return data

            alumno = data.get("alumno")
            if RegistroRAC.objects.filter(alumno=alumno, ciclo_escolar=ciclo_actual).exists():
                raise serializers.ValidationError(
                    {"alumno": "Este alumno ya tiene un registro RAC en el ciclo escolar activo."}
                )

        return data

    def create(self, validated_data):
        """Asignar ciclo escolar, maestro, escuelas y datos del alumno automáticamente"""
        request = self.context.get("request")

        try:
            validated_data["ciclo_escolar"] = get_current_ciclo_escolar_instance()
        except Exception:
            raise serializers.ValidationError("No hay un ciclo escolar activo configurado.")

        # Maestro de apoyo = usuario autenticado (a menos que ya venga explícito)
        if "maestro_apoyo" not in validated_data and request and request.user.is_authenticated:
            validated_data["maestro_apoyo"] = request.user

        # Autorrellenar datos del alumno
        alumno = validated_data.get("alumno")
        if alumno:
            validated_data["curp"] = alumno.curp
            validated_data["sexo"] = alumno.sexo
            validated_data["edad"] = alumno.edad
            validated_data["grado"] = alumno.grado

            # Escuela regular = escuela del alumno
            if "escuela_regular" not in validated_data and alumno.escuela:
                validated_data["escuela_regular"] = alumno.escuela
                validated_data["zona_regular"] = getattr(alumno.escuela, "zona", "")

            # Escuela básica = misma que la regular por defecto
            if "escuela_basica" not in validated_data and alumno.escuela:
                validated_data["escuela_basica"] = alumno.escuela

        # Service type por defecto
        if "service_type" not in validated_data:
            validated_data["service_type"] = "USAER"

        return super().create(validated_data)
