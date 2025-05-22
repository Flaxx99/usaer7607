from django.contrib import admin
from .models import Permiso
# Register your models here.

@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('profesor', 'tipo_permiso', 'estado', 'fecha_inicio', 'fecha_fin', 'escuela')
    list_filter = ('estado', 'tipo_permiso', 'escuela')
    search_fields = ('profesor__nombre', 'profesor__apellido_paterno', 'profesor__numero_empleado')
