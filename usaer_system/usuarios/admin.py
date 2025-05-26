from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
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
            )
        }),
        (_('Permisos'), {
            'fields': (
                'is_active','is_staff','is_superuser',
                'groups','user_permissions'
            )
        }),
        (_('Fechas importantes'), {
            'fields': ('last_login','date_joined')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username','password1','password2',
                'role','numero_empleado','escuela'
            ),
        }),
    )
