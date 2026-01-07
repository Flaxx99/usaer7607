from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _
from escuelas.models import Escuela

User = get_user_model()

class EscuelaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escuela
        fields = ['id', 'nombre', 'clave', 'nivel']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer principal para crear, listar y editar usuarios.
    """
    escuela_detalle = EscuelaSimpleSerializer(source='escuela', read_only=True)
    nombre_completo = serializers.ReadOnlyField()
    antiguedad = serializers.ReadOnlyField()
    # Campo de contraseña solo escritura para creación/edición
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'id', 'email', 'numero_empleado', 'role', 
            'nombre', 'apellido_paterno', 'apellido_materno', 'nombre_completo',
            'escuela', 'escuela_detalle',
            'telefono', 'celular', 'domicilio',
            'rfc', 'curp', 
            'nivel', 'grado', 'situacion',
            'fecha_ingreso', 'antiguedad', 'activo',
            'password' 
        ]
        read_only_fields = ['fecha_ingreso', 'last_login', 'date_joined']

    def create(self, validated_data):
        """Encripta la contraseña al crear"""
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """Encripta la contraseña si se envía al editar"""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class LoginSerializer(serializers.Serializer):
    """
    Recibe 'username' (email o #empleado) y 'password'.
    Valida usando tu backend personalizado.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            # Esto llama a tu EmailOrEmpleadoBackend automáticamente
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if not user:
                raise serializers.ValidationError(_("Credenciales inválidas."), code='authorization')
        else:
            raise serializers.ValidationError(_("Debes incluir 'username' y 'password'."))

        data['user'] = user
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)