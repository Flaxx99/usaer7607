from functools import wraps
from django.core.exceptions import PermissionDenied
from django.contrib.auth.views import redirect_to_login

def roles_permitidos(roles):
    """
    Decorador para vistas: solo usuarios con request.user.role en la lista roles.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                # redirigir a login si no está autenticado
                return redirect_to_login(request.get_full_path())
            if request.user.role not in roles:
                # denegar si su role no está autorizado
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator

def solo_admin(view_func):
    """
    Decorador para vistas: solo Personal Administrativo (ADMIN) puede entrar.
    """
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != request.user.Role.ADMINISTRATIVO:
            raise PermissionDenied
        return view_func(request, *args, **kwargs)
    return _wrapped
