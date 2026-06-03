# usuarios/admin.py

# --- IMPORTACIONES DE MODELOS Y ADMINS DE OTRAS APPS ---
# Alumnos

# Asistencias

# Calendario
from django.contrib.auth.admin import GroupAdmin, UserAdmin
from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _

# Documentos
# Escuelas
# Incidencias
# Oficios
# Permisos
# RAC
# RAE
from .admin_site import admin_site
from .forms import UsuarioChangeForm, UsuarioCreationForm
from .models import User


class UserAdminConfig(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    # ... (el resto de tus configuraciones de UserAdminConfig) ...
    list_display = ("email", "numero_empleado", "get_full_name", "role", "escuela", "activo")
    list_filter = ("role", "escuela", "activo", "nivel", "situacion")
    search_fields = (
        "email",
        "numero_empleado",
        "nombre",
        "apellido_paterno",
        "apellido_materno",
        "curp",
        "rfc",
    )
    ordering = ("apellido_paterno", "apellido_materno", "nombre")
    fieldsets = (
        (_("Credenciales"), {"fields": ("email", "numero_empleado", "password")}),
        (
            _("Información personal"),
            {"fields": ("nombre", "apellido_paterno", "apellido_materno", ("curp", "rfc"))},
        ),
        (
            _("Información de contacto"),
            {"fields": ("domicilio", ("telefono", "celular"), "correo")},
        ),
        (_("Información académica"), {"fields": (("nivel", "grado"), "escolaridad")}),
        (
            _("Información laboral"),
            {
                "fields": (
                    "role",
                    "escuela",
                    "situacion",
                    "fecha_ingreso",
                    "clave_presupuestal",
                    "numero_pensiones",
                    "activo",
                )
            },
        ),
        (
            _("Permisos"),
            {
                "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
            },
        ),
        (_("Fechas importantes"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "numero_empleado", "password1", "password2", "role", "escuela"),
            },
        ),
        (
            _("Información personal"),
            {"fields": ("nombre", "apellido_paterno", "apellido_materno", ("curp", "rfc"))},
        ),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()

    get_full_name.short_description = _("Nombre completo")


# --- ¡REGISTRA TODOS LOS MODELOS AQUÍ MISMO! ---
# Esto garantiza que el registro ocurra tan pronto como este módulo se cargue.
admin_site.register(User, UserAdminConfig)
admin_site.register(Group, GroupAdmin)
# admin_site.register(Permission) # Opcional: Si el sistema de roles personalizado reemplaza los permisos de Django, este registro podría no ser necesario.
# Si se usan en conjunto, asegúrate de que sus roles estén claramente definidos.
