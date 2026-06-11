# usuarios/serializers.py
from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from escuelas.models import Escuela
from rest_framework import serializers

from .models import CalendarEvent, SystemConfiguration

User = get_user_model()


class EscuelaSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para mostrar info básica de la escuela en el perfil.
    """

    class Meta:
        model = Escuela
        fields = ["id", "nombre", "clave_estatal", "nivel", "zona"]


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para listados y dropdowns — sin PII.
    """

    escuela_detalle = EscuelaSimpleSerializer(source="escuela", read_only=True)
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "numero_empleado",
            "role",
            "nombre_completo",
            "escuela",
            "escuela_detalle",
            "activo",
            "is_superuser",
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer completo para crear, editar y ver detalle de usuarios.
    Incluye datos sensibles (RFC, CURP, domicilio) — solo para operaciones
    que los requieran explícitamente.
    """

    escuela_detalle = EscuelaSimpleSerializer(source="escuela", read_only=True)
    nombre_completo = serializers.ReadOnlyField()
    antiguedad = serializers.ReadOnlyField()

    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "numero_empleado",
            "role",
            "nombre",
            "apellido_paterno",
            "apellido_materno",
            "nombre_completo",
            "escuela",
            "escuela_detalle",
            "telefono",
            "celular",
            "domicilio",
            "rfc",
            "curp",
            "nivel",
            "grado",
            "situacion",
            "fecha_ingreso",
            "antiguedad",
            "activo",
            "password",
            "is_superuser",
        ]
        read_only_fields = [
            "fecha_ingreso",
            "last_login",
            "date_joined",
            "antiguedad",
            "nombre_completo",
            "is_superuser",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def validate(self, data):
        excluir = ["email", "password", "role", "fecha_ingreso", "telefono", "celular"]
        for field, value in data.items():
            if field not in excluir and isinstance(value, str):
                data[field] = value.upper()
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")
        if username and password:
            user = authenticate(
                request=self.context.get("request"), username=username, password=password
            )
            if not user:
                raise serializers.ValidationError(
                    _("Credenciales inválidas."), code="authorization"
                )
        else:
            raise serializers.ValidationError(_("Debes incluir 'username' y 'password'."))
        data["user"] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class CalendarEventSerializer(serializers.ModelSerializer):
    created_by_nombre = serializers.ReadOnlyField(source="created_by.get_full_name")
    assigned_to_nombre = serializers.ReadOnlyField(source="assigned_to.get_full_name")
    alumno_nombre = serializers.ReadOnlyField(source="alumno.get_full_name")
    escuela_nombre = serializers.ReadOnlyField(source="escuela.nombre")

    class Meta:
        model = CalendarEvent
        fields = "__all__"
        read_only_fields = ["created_by"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        # Si no se especificó asignación, se asume que es una tarea personal del creador
        if "assigned_to" not in validated_data:
            validated_data["assigned_to"] = self.context["request"].user
        return super().create(validated_data)


class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = "__all__"
