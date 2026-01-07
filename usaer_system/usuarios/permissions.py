from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdminOrSecretario(permissions.BasePermission):
    """
    Permite acceso solo a Administradores y Secretarios.
    Equivalente a: @roles_permitidos([ADMIN, SECRETARIO])
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        allowed_roles = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        return request.user.role in allowed_roles or request.user.is_superuser

class IsAdminUserOnly(permissions.BasePermission):
    """
    Solo Administradores (para borrar usuarios).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.role == User.Role.ADMINISTRADOR.value or request.user.is_superuser))