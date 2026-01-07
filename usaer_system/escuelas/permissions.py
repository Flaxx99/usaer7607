from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdminOrSecretarioOrReadOnly(permissions.BasePermission):
    """
    Regla de Seguridad:
    1. Lectura (GET): Permitido a cualquier usuario autenticado (Maestros, etc.)
    2. Escritura (POST, PUT, DELETE): Solo Administradores y Secretarios.
    """

    def has_permission(self, request, view):
        # 1. El usuario debe estar autenticado siempre
        if not request.user.is_authenticated:
            return False

        # 2. Métodos seguros (GET, HEAD, OPTIONS) -> Pasan todos los logueados
        if request.method in permissions.SAFE_METHODS:
            return True

        # 3. Métodos destructivos (POST, PUT, DELETE) -> Solo Admin/Secretario
        roles_gestion = [
            User.Role.ADMINISTRADOR.value,
            User.Role.SECRETARIO.value,
        ]
        return request.user.role in roles_gestion or request.user.is_superuser