from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm
# Panel de administración personalizado
from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    site_header = _("Panel de Administración")
    site_title = _("Administración")
    index_title = _("Bienvenido al Panel Administrativo")

    def has_permission(self, request):
        return request.user.is_active and request.user.is_staff and getattr(request.user, 'role', None) == 'ADMIN'

# Instancia personalizada del sitio admin
admin_site = CustomAdminSite(name='custom_admin')


class UserAdminConfig(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    list_display = (
        'username', 
        'get_full_name',
        'role',
        'escuela',
        'puesto',
        'activo'
    )

    list_filter = (
        'role',
        'escuela',
        'puesto',
        'activo',
        'nivel',
        'situacion'
    )

    search_fields = (
        'username',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'numero_empleado',
        'curp',
        'rfc'
    )

    ordering = ('apellido_paterno', 'apellido_materno', 'nombre')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información personal'), {
            'fields': (
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                ('curp', 'rfc'),
                'numero_empleado'
            )
        }),
        (_('Información de contacto'), {
            'fields': (
                'domicilio',
                ('telefono', 'celular'),
                'correo'
            )
        }),
        (_('Información académica'), {
            'fields': (
                ('nivel', 'grado'),
                'escolaridad'
            )
        }),
        (_('Información laboral'), {
            'fields': (
                'role',
                'escuela',
                ('puesto', 'situacion'),
                'fecha_ingreso',
                'clave_presupuestal',
                'numero_pensiones',
                'activo'
            )
        }),
        (_('Permisos'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions'
            ),
        }),
        (_('Fechas importantes'), {
            'fields': (
                'last_login',
                'date_joined'
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'password1',
                'password2',
                'role',
                'escuela'
            ),
        }),
        (_('Información personal'), {
            'fields': (
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                ('curp', 'rfc'),
                'numero_empleado'
            )
        }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = _('Nombre completo')

# Registrar con el sitio admin personalizado
admin_site.register(User, UserAdminConfig)
