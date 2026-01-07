from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdminDirectorOrOwner(permissions.BasePermission):
    """
    - LIST: Admin/Director (Todo/Escuela), Owner (Suyo).
    - CREATE: Authenticated users.
    - RESPONDER (Action): Admin/Director.
    - UPDATE/DESTROY: Owner (Solo si PENDIENTE), Admin/Director (Total).
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        roles_autoridad = [User.Role.ADMINISTRADOR.value, User.Role.DIRECTOR.value]

        # 1. Autoridad: Acceso total
        if user.role in roles_autoridad or user.is_superuser:
            return True

        # 2. Dueño del permiso
        if obj.profesor == user:
            # Solo puede borrar o editar si está PENDIENTE
            if request.method in ['PUT', 'PATCH', 'DELETE']:
                return obj.estado == 'PENDIENTE'
            return True # GET permitido siempre

        return False