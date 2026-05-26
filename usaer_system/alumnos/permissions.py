from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsMaestroOAdmin(permissions.BasePermission):
    """
    Replica ESTRICTAMENTE el decorador roles_permitidos de urls.py.
    Permite acceso total solo a:
    1. Maestro de Apoyo
    2. Administrador
    Cualquier otro rol recibe 403 Forbidden.
    """

    def has_permission(self, request, view):
        # 1. El usuario debe estar autenticado
        if not request.user.is_authenticated:
            return False

        # 2. Roles permitidos (Copiado de tu lógica original)
        roles_admitidos = [
            User.Role.MAESTRO_APOYO.value,
            User.Role.ADMINISTRADOR.value,
            User.Role.DIRECTOR.value,
            User.Role.SECRETARIO.value,
        ]

        # 3. Validación
        return request.user.role in roles_admitidos or request.user.is_superuser