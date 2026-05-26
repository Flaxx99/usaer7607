from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdminOrSecretarioOrReadOnly(permissions.BasePermission):
    """
    Permisos para Oficios:
    - Leer (GET, HEAD, OPTIONS): Cualquier usuario autenticado.
    - Escribir (POST, PUT, PATCH, DELETE): Solo Administrador y Secretario.
    """

    def has_permission(self, request, view):
        # El usuario debe estar autenticado
        if not (request.user and request.user.is_authenticated):
            return False

        # Si es un método seguro, se permite
        if request.method in permissions.SAFE_METHODS:
            return True

        # Roles con permiso de escritura
        roles_escritura = ['ADMIN', 'SECRETARIO']
        return (request.user.is_superuser or 
                getattr(request.user, 'role', '') in roles_escritura)
