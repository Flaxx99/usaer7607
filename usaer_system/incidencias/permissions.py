from django.contrib.auth import get_user_model
from rest_framework import permissions

User = get_user_model()


class IncidenciaPermission(permissions.BasePermission):
    """
    Matriz de roles para Incidencias:
    - LISTAR: Admin, Director.
    - CREAR: Admin, Director (Secretario NO).
    - DETALLE: Admin, Director, Maestro Apoyo (Solo si es el involucrado).
    - EDITAR/ELIMINAR: Admin, Director.
    - RESOLVER: Solo Admin.
    """

    def has_permission(self, request, view):
        # 1. Autenticación básica
        if not request.user.is_authenticated:
            return False

        # 2. Permisos globales (Listar y Crear)
        if view.action == "create":
            roles_crear = [User.Role.ADMINISTRADOR.value, User.Role.DIRECTOR.value]
            return request.user.role in roles_crear or request.user.is_superuser

        # Para las demás acciones, dejamos pasar aquí y validamos a nivel de objeto (has_object_permission)
        # o dejamos que la vista filtre el QuerySet.
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        roles_admin_dir = [User.Role.ADMINISTRADOR.value, User.Role.DIRECTOR.value]

        # ADMIN y DIRECTOR tienen acceso total a todo (menos resolver para Director si somos estrictos)
        if user.role in roles_admin_dir or user.is_superuser:
            # Caso especial: RESOLVER solo Admin (según tu ruta resolver_incidencia)
            if view.action == "resolver":
                return user.role == User.Role.ADMINISTRADOR.value or user.is_superuser
            return True

        # MAESTRO DE APOYO (Solo lectura y solo si es SU incidencia)
        if user.role == User.Role.MAESTRO_APOYO.value:
            if request.method in permissions.SAFE_METHODS:  # GET
                return obj.profesor == user
            return False  # No puede editar ni borrar

        return False
