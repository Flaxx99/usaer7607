<<<<<<< HEAD
=======
# alumnos/admin.py
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
from django.contrib import admin
from .models import Alumno

@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
<<<<<<< HEAD
    list_display  = ('apellido_paterno','apellido_materno','nombres','curp','sexo','edad','grado','clasificacion')
    list_filter   = ('grado','clasificacion','sexo')
    search_fields = ('apellido_paterno','apellido_materno','nombres','curp')
=======
    list_display = (
        'apellido_paterno',
        'apellido_materno',
        'nombres',
        'profesor',
        'escuela',
    )
    search_fields = (
        'apellido_paterno',
        'apellido_materno',
        'nombres',
        'curp',
    )
    list_filter = (
        'escuela',
        'profesor',
    )
    list_select_related = ('profesor', 'escuela')
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
