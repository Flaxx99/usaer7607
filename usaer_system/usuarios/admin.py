# usuarios/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext_lazy as _
from django.contrib.admin import AdminSite

# Importa tus formularios de usuario
from .forms import UsuarioCreationForm, UsuarioChangeForm

# Importa TU MODELO DE USUARIO
from .models import User

# --- ¡NUEVAS IMPORTACIONES DE TUS OTROS MODELOS Y SUS ADMINMODELS! ---
# Asegúrate de importar CADA MODELO Y CADA CLASE ADMINMODEL que registras abajo.

# Alumnos
from alumnos.models import Alumno
from alumnos.admin import AlumnoAdmin

# Asistencias
from asistencias.models import Asistencia
from asistencias.admin import AsistenciaAdmin

# Documentos
from documentos.models import Expediente
from documentos.admin import ExpedienteAdmin

# Escuelas
from escuelas.models import Escuela
from escuelas.admin import EscuelaAdmin

# Oficios
from oficios.models import Oficio
from oficios.admin import OficioAdmin

# RAC
from rac.models import RegistroRAC
from rac.admin import RegistroRACAdmin

# RAE
from rae.models import RegistroRAE, CicloEscolar
from rae.admin import RegistroRAEAdmin, CicloEscolarAdmin

# Descomenta y ajusta si los tienes:
# from incidencias.models import Incidencia
# from incidencias.admin import IncidenciaAdmin
# from permisos.models import Permiso
# from permisos.admin import PermisoAdmin
# from tu_app_calendario.models import EventoCalendario # Si tienes esta app
# from tu_app_calendario.admin import EventoCalendarioAdmin
# --- FIN DE LAS NUEVAS IMPORTACIONES ---


class CustomAdminSite(AdminSite):
    site_header = _("Panel de Administración")
    site_title = _("Administración")
    index_title = _("Bienvenido al Panel Administrativo")

    def has_permission(self, request):
        if request.user.is_superuser:
            return True
        user_role = getattr(request.user, 'role', None)
        return request.user.is_active and request.user.is_staff and (user_role and user_role.upper() == 'ADMIN')


admin_site = CustomAdminSite(name='custom_admin')


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
        (_('Información laboral'), { 'fields': ('role', 'escuela', ('puesto', 'situacion'), 'fecha_ingreso', 'clave_presupuestal', 'numero_pensiones', 'activo') }),
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
# admin_site.register(Permission) # Opcional

admin_site.register(Alumno, AlumnoAdmin)
admin_site.register(Asistencia, AsistenciaAdmin)
admin_site.register(Expediente, ExpedienteAdmin)
admin_site.register(Escuela, EscuelaAdmin)
admin_site.register(Oficio, OficioAdmin)
admin_site.register(RegistroRAC, RegistroRACAdmin)
admin_site.register(RegistroRAE, RegistroRAEAdmin)
admin_site.register(CicloEscolar, CicloEscolarAdmin)
# Descomenta si los usas:
# admin_site.register(Incidencia, IncidenciaAdmin)
# admin_site.register(Permiso, PermisoAdmin)
# admin_site.register(EventoCalendario, EventoCalendarioAdmin)