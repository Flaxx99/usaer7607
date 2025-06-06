# usuarios/decoradores.py
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from .models import User

def roles_permitidos(roles):
    """
    Decorador para vistas: exige login y que request.user.role esté en la lista roles.
    """
    def decorator(view_func):
        @wraps(view_func)
        @login_required  # maneja el 'next' y la redirección al LOGIN_URL automáticamente
        def _wrapped(request, *args, **kwargs):
            if request.user.role not in roles:
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator

def solo_admin(view_func):
    """
    Decorador para vistas: sólo Personal Administrativo (role == 'ADMIN') puede entrar.
    """
    @wraps(view_func)
    @login_required
    def _wrapped(request, *args, **kwargs):
        # comparamos contra el .value correcto del enum
        if request.user.role != User.Role.ADMIN.value:
            raise PermissionDenied
        return view_func(request, *args, **kwargs)
    return _wrapped
