# documentos/permissions.py
from django.contrib.auth import get_user_model
from rest_framework import permissions

User = get_user_model()


class ExpedientePermission(permissions.BasePermission):
    """
    Lógica de Seguridad para Expedientes:

    1. ADMIN/SECRETARIO: Control Total.
    2. PROFESOR DUEÑO (Creador): Puede Ver, Editar y BORRAR sus expedientes.
    3. PROFESOR ACTUAL DEL ALUMNO: Puede Ver y Editar (si heredó el alumno),
       pero NO puede Borrar el expediente completo ni sus archivos adjuntos individuales.
    4. EQUIPO ITINERANTE: Solo Lectura (GET) y solo si es de su escuela.
    """

    def has_permission(self, request, view):
        # Nivel vista: Solo usuarios logueados entran
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # 1. Admin/Secretario/Superuser: Todo permitido
        roles_gestion = [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]
        if user.role in roles_gestion or user.is_superuser:
            return True

        # 2. Profesor Dueño (Creador): Todo permitido (incluido Borrar y eliminar archivos extra)
        if obj.profesor == user:
            return True

        # 3. Profesor Actual del Alumno (Si es diferente al creador):
        # Puede Ver y Editar, pero NO Borrar.
        if obj.alumno.profesor == user:
            # Lista negra de acciones destructivas
            if view.action in ["destroy", "eliminar_archivo_extra"]:
                return False
            return True

        # 4. Equipo Itinerante: Solo Lectura
        roles_equipo = [
            User.Role.PSICOLOGO.value,
            User.Role.TRABAJADOR_SOCIAL.value,
            User.Role.COMUNICACION.value,
            User.Role.PSICOMOTRICIDAD.value,
        ]

        if user.role in roles_equipo:
            # Solo permitimos métodos seguros (GET, HEAD, OPTIONS)
            if request.method in permissions.SAFE_METHODS:
                # Verificamos si pertenecen a la misma escuela
                if user.escuela == obj.alumno.escuela:
                    return True

        # Si no cumple ninguna condición anterior, denegar
        return False
