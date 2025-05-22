from django.contrib import admin
from .models import Profesor

# Register your models here.

@admin.register(Profesor)
class ProfesorAdmin(admin.ModelAdmin):
    list_display = ('apellido_paterno', 'apellido_materno', 'nombre', 'numero_empleado', 'puesto', 'nivel', 'activo')
    list_filter = ('nivel', 'puesto', 'situacion', 'activo')
    search_fields = ('nombre', 'apellido_paterno', 'apellido_materno', 'numero_empleado', 'curp', 'rfc')
