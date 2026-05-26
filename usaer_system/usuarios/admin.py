# usuarios/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext_lazy as _
from .forms import UsuarioCreationForm, UsuarioChangeForm
from .models import User
from .admin_site import admin_site

# --- IMPORTACIONES DE MODELOS Y ADMINS DE OTRAS APPS ---
# Alumnos
from alumnos.models import Alumno
from alumnos.admin import AlumnoAdmin

# Asistencias
from asistencias.models import Asistencia
from asistencias.admin import AsistenciaAdmin

# Calendario
from calendario.models import EventoCalendario
from calendario.admin import EventoCalendarioAdmin

# Documentos
from documentos.models import Expediente
from documentos.admin import ExpedienteAdmin

# Escuelas
from escuelas.models import Escuela
from escuelas.admin import EscuelaAdmin

# Incidencias
from incidencias.models import Incidencia
from incidencias.admin import IncidenciaAdmin

# Oficios
from oficios.models import Oficio
from oficios.admin import OficioAdmin

# Permisos
from permisos.models import Permiso
from permisos.admin import PermisoAdmin

# RAC
from rac.models import RegistroRAC
from rac.admin import RegistroRACAdmin

# RAE
from rae.models import RegistroRAE, CicloEscolar
from rae.admin import RegistroRAEAdmin, CicloEscolarAdmin

class UserAdminConfig(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    # ... (el resto de tus configuraciones de UserAdminConfig) ...
    list_display = (
        'email',
        'numero_empleado',
        'get_full_name',
        'role',
        'escuela',
        'activo'
    )
    list_filter = (
        'role',
        'escuela',
        'activo',
        'nivel',
        'situacion'
    )
    search_fields = (
        'email',
        'numero_empleado',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'curp',
        'rfc'
    )
    ordering = ('apellido_paterno', 'apellido_materno', 'nombre')
    fieldsets = (
        (_('Credenciales'), { 'fields': ('email', 'numero_empleado', 'password') }),
        (_('Información personal'), { 'fields': ('nombre', 'apellido_paterno', 'apellido_materno', ('curp', 'rfc')) }),
        (_('Información de contacto'), { 'fields': ('domicilio', ('telefono', 'celular'), 'correo') }),
        (_('Información académica'), { 'fields': (('nivel', 'grado'), 'escolaridad') }),
        (_('Información laboral'), { 'fields': ('role', 'escuela', 'situacion', 'fecha_ingreso', 'clave_presupuestal', 'numero_pensiones', 'activo') }),
        (_('Permisos'), { 'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'), }),
        (_('Fechas importantes'), { 'fields': ('last_login', 'date_joined') }),
    )
    add_fieldsets = (
        (None, { 'classes': ('wide',), 'fields': ('email', 'numero_empleado', 'password1', 'password2', 'role', 'escuela') }),
        (_('Información personal'), { 'fields': ('nombre', 'apellido_paterno', 'apellido_materno', ('curp', 'rfc')) }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = _('Nombre completo')


# --- ¡REGISTRA TODOS LOS MODELOS AQUÍ MISMO! ---
# Esto garantiza que el registro ocurra tan pronto como este módulo se cargue.
admin_site.register(User, UserAdminConfig)
admin_site.register(Group, GroupAdmin)
# admin_site.register(Permission) # Opcional: Si el sistema de roles personalizado reemplaza los permisos de Django, este registro podría no ser necesario.
# Si se usan en conjunto, asegúrate de que sus roles estén claramente definidos.
