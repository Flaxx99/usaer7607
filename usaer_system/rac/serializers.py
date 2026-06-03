# rac/serializers.py

from ciclos_escolares.utils import get_current_ciclo_escolar_instance
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
                alumno = data.get("alumno")
                if RegistroRAC.objects.filter(alumno=alumno, ciclo_escolar=ciclo_actual).exists():
                    raise serializers.ValidationError(
                        {
                            "alumno": "Este alumno ya tiene un registro RAC en el ciclo escolar activo."
                        }
                    )
            except Exception:
                pass  # Si no hay ciclo activo, dejamos pasar o lanzamos otro error según prefieras

        return data

    def create(self, validated_data):
        """Asignar ciclo escolar automáticamente al crear"""
        try:
            validated_data["ciclo_escolar"] = get_current_ciclo_escolar_instance()
        except Exception:
            raise serializers.ValidationError("No hay un ciclo escolar activo configurado.")

        # Lógica de autorrellenado de datos del alumno
        alumno = validated_data.get("alumno")
        if alumno:
            validated_data["curp"] = alumno.curp
            validated_data["sexo"] = alumno.sexo
            validated_data["edad"] = alumno.edad
            validated_data["grado"] = alumno.grado
            if alumno.escuela:
                validated_data["zona_regular"] = getattr(alumno.escuela, "zona", "")

        return super().create(validated_data)
