# rac/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class RACPermission(permissions.BasePermission):
    """
    Defense-in-depth: duplica la lógica de get_queryset como has_object_permission.

    - ADMIN / SECRETARIO: acceso total.
    - MAESTRO_APOYO: solo sus propios registros (maestro_apoyo == user).
    - Otros roles autenticados: acceso según escuela (quedan cubiertos por get_queryset).
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        roles_gestion = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if user.role in roles_gestion or user.is_superuser:
            return True

        if user.role == User.Role.MAESTRO_APOYO.value:
            return obj.maestro_apoyo == user

        # Para roles itinerantes, director, etc.: coincidencia por escuela
        if hasattr(user, 'escuela') and user.escuela:
            return obj.alumno.escuela_id == user.escuela_id

        return False
