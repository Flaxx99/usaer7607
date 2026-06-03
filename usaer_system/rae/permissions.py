# rae/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class RAEPermission(permissions.BasePermission):
    """
    Defense-in-depth: duplica la lógica de get_queryset como has_object_permission.

    - ADMIN / SECRETARIO: acceso total.
    - Otros roles autenticados: solo registros de su escuela.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        roles_gestion = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if user.role in roles_gestion or user.is_superuser:
            return True

        if hasattr(user, 'escuela') and user.escuela:
            return obj.escuela_id == user.escuela_id

        return False
