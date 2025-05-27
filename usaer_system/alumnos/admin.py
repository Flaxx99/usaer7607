# alumnos/admin.py
from django.contrib import admin
from .models import Alumno

@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
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