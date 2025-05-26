from django.contrib import admin
from .models import Incidencia

@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
    list_display   = ('profesor', 'escuela', 'fecha')
    list_filter    = ('escuela', 'profesor')
    search_fields  = ('profesor__username', 'descripcion', 'respuesta_admin')
    date_hierarchy = 'fecha'
