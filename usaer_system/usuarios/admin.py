from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
<<<<<<< HEAD
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('username', 'get_full_name', 'role', 'numero_empleado', 'is_active', 'is_staff')
    list_filter   = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username','numero_empleado','curp','first_name','last_name','email')
    ordering      = ('username',)

    fieldsets = (
        (None, {
            'fields': ('username','password')
        }),
        (_('Información personal'), {
            'fields': (
                'nombre','apellido_paterno','apellido_materno',
                'email','telefono','celular','domicilio'
            )
        }),
        (_('Identificación'), {
            'fields': (
                'curp','rfc','clave_presupuestal',
                'numero_empleado','numero_pensiones'
            )
        }),
        (_('Asignación y rol'), {
            'fields': (
                'role','escuela','nivel','grado',
                'puesto','situacion','escolaridad',
                'fecha_ingreso','activo'
=======

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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
            )
        }),
        (_('Permisos'), {
            'fields': (
<<<<<<< HEAD
                'is_active','is_staff','is_superuser',
                'groups','user_permissions'
            )
        }),
        (_('Fechas importantes'), {
            'fields': ('last_login','date_joined')
        }),
    )

=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
<<<<<<< HEAD
                'username','password1','password2',
                'role','numero_empleado','escuela'
            ),
        }),
    )
=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
