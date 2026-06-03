# usuarios/admin_site.py
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _

from .models import User


class CustomAdminSite(AdminSite):
    site_header = _("Panel de Administración")
    site_title = _("Administración")
    index_title = _("Bienvenido al Panel Administrativo")

    def has_permission(self, request):
        if request.user.is_superuser:
            return True
        user_role = getattr(request.user, "role", None)
        return (
            request.user.is_active
            and request.user.is_staff
            and (user_role and user_role == User.Role.ADMINISTRADOR.value)
        )


admin_site = CustomAdminSite(name="custom_admin")
