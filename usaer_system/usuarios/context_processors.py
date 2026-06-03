from django.conf import settings


def permisos_usuario(request):
    user = request.user
    if user.is_authenticated:
        permisos = settings.ROLE_PERMISSIONS.get(user.role, [])
    else:
        permisos = []
    return {"permisos_usuario": permisos}
