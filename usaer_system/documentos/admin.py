from django.contrib import admin
from .models import Expediente, OtroArchivo
from usuarios.admin_site import admin_site

class OtroArchivoInline(admin.TabularInline):
    model = OtroArchivo
    extra = 0
    readonly_fields = ('__str__',)

class ExpedienteAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'profesor', 'fecha_subida')
    search_fields = ('alumno__nombres','profesor__email')
    inlines = [OtroArchivoInline]
    exclude = ('profesor',)

admin_site.register(Expediente, ExpedienteAdmin)
