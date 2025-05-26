from django.contrib import admin
from .models import Alumno

@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
    list_display  = ('apellido_paterno','apellido_materno','nombres','curp','sexo','edad','grado','clasificacion')
    list_filter   = ('grado','clasificacion','sexo')
    search_fields = ('apellido_paterno','apellido_materno','nombres','curp')
