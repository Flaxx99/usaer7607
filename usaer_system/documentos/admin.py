from django.contrib import admin
from .models import Expediente, OtroArchivo

class OtroArchivoInline(admin.TabularInline):
    model = OtroArchivo
    extra = 0
    readonly_fields = ('__str__',)

@admin.register(Expediente)
class ExpedienteAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'profesor', 'fecha_subida')
    search_fields = ('alumno__nombres','profesor__email')
    inlines = [OtroArchivoInline]
    exclude = ('profesor',)

@admin.register(OtroArchivo)
class OtroArchivoAdmin(admin.ModelAdmin):
    list_display = ('expediente', 'nombre', 'descripcion')
    search_fields = ('expediente__alumno__nombres', 'nombre', 'descripcion')
    list_filter = ('expediente__alumno__escuela',)