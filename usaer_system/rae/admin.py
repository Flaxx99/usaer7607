from django.contrib import admin
from .models import CicloEscolar, RegistroRAE, RAEAlumno # Importa tus modelos
from usuarios.admin_site import admin_site

class CicloEscolarAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'fecha_inicio', 'fecha_fin', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)

class RegistroRAEAdmin(admin.ModelAdmin):
    list_display = ('escuela', 'ciclo_escolar', 'creado_por', 'fecha_creacion', 'docente_hombres', 'docente_mujeres')
    list_filter = ('escuela', 'ciclo_escolar', 'creado_por')
    search_fields = ('escuela__nombre', 'ciclo_escolar__nombre', 'creado_por__username')
    # Si quieres que los detalles de los alumnos aparezcan directamente en el formulario de RegistroRAE:
    # inlines = [RAEAlumnoInline] # Necesitarías definir RAEAlumnoInline primero

class RAEAlumnoAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'registro', 'curp', 'genero', 'edad', 'grado', 'capturado_por')
    list_filter = ('registro__escuela', 'registro__ciclo_escolar', 'genero', 'grado', 'capturado_por')
    search_fields = ('alumno__nombre', 'alumno__apellido_paterno', 'curp')
    # Si tienes muchos booleanos, considera list_filter para ellos o un custom filter

# Si quieres RAEAlumno como inline para RegistroRAE
# class RAEAlumnoInline(admin.TabularInline): # O admin.StackedInline
#     model = RAEAlumno
#     extra = 1 # Número de formularios extra para agregar

admin_site.register(CicloEscolar, CicloEscolarAdmin)
admin_site.register(RegistroRAE, RegistroRAEAdmin)
admin_site.register(RAEAlumno, RAEAlumnoAdmin)