from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Columns to display in the changelist
    list_display = (
        'username',
        'get_full_name',   # heredado de AbstractUser
        'role',
        'numero_empleado',
        'is_staff',
    )
    list_filter = (
        'role',
        'is_staff',
        'is_superuser',
        'is_active',
    )

    # Organiza los campos en pestañas/fieldsets dentro del form de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información personal'), {
            'fields': (
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                'curp',
                'rfc',
                'clave_presupuestal',
                'numero_empleado',
                'numero_pensiones',
                'correo',
            )
        }),
        (_('Asignación'), {
            'fields': (
                'role',
                'escuela',
                'nivel',
                'grado',
                'puesto',
                'situacion',
                'escolaridad',
                'fecha_ingreso',
                'activo',
            )
        }),
        (_('Permisos'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                #'groups',
                'user_permissions',
            )
        }),
        (_('Fechas importantes'), {'fields': ('last_login', 'date_joined')}),
    )

    # Cuando creas un usuario nuevo
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'password1',
                'password2',
                'role',
                'escuela',
                'numero_empleado',
            ),
        }),
    )

    search_fields = ('username', 'numero_empleado', 'curp', 'nombre', 'apellido_paterno')
    ordering = ('username',)
