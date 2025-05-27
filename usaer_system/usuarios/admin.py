from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm

class UserAdminConfig(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm
    
    # Campos a mostrar en la lista de usuarios
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
    
    # Campos para la vista de edición
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
    
    # Campos para la vista de creación
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
    
    # Método para mostrar nombre completo en admin
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = _('Nombre completo')

admin.site.register(User, UserAdminConfig)