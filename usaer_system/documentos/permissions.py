from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class ExpedientePermission(permissions.BasePermission):
    """
    Lógica de Seguridad (Réplica exacta de tu sistema original):
    - ADMIN/SECRETARIO: Control Total.
    - PROFESOR DUEÑO: Puede Ver, Editar y BORRAR sus expedientes.
    - PROFESOR ACTUAL DEL ALUMNO: Puede Ver y Editar (si heredó el alumno), NO Borrar.
    - EQUIPO ITINERANTE: Solo Lectura (GET) si es de su escuela.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # 1. Admin/Secretario/Superuser: Todo permitido
        roles_gestion = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if user.role in roles_gestion or user.is_superuser:
            return True

        # 2. Profesor Dueño (Creador): Todo permitido (incluido Borrar)
        if obj.profesor == user:
            return True
        
        # 3. Profesor Actual del Alumno (Si es diferente al creador):
        # Puede Ver y Editar, pero NO Borrar.
        if obj.alumno.profesor == user:
            if view.action == 'destroy':
                return False
            return True

        # 4. Equipo Itinerante: Solo Lectura
        roles_equipo = [
            User.Role.PSICOLOGO.value, User.Role.TRABAJADOR_SOCIAL.value, 
            User.Role.COMUNICACION.value, User.Role.PSICOMOTRICIDAD.value
        ]
        if user.role in roles_equipo:
            if request.method in permissions.SAFE_METHODS: # Solo GET
                # Verificamos si pertenecen a la misma escuela
                if user.escuela == obj.alumno.escuela:
                    return True

        return False