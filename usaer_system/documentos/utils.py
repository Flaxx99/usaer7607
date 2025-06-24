from usuarios.models import User
from usaer_system.settings import ROLE_PERMISSIONS

def tiene_permiso(user, permiso):
    if user.is_superuser:
        return True
    return permiso in ROLE_PERMISSIONS.get(user.role, [])
