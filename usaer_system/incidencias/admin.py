from django.contrib import admin
from .models import Incidencia
# Register your models here.

@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
    list_display = ('profesor', 'escuela', 'fecha')
    list_filter = ('fecha', 'escuela')
    search_fields = ('profesor__nombre', 'descripcion')
