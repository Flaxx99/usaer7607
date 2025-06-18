from django.contrib import admin
from .models import Expediente

@admin.register(Expediente)
class ExpedienteAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'profesor', 'fecha_subida')
    search_fields = ('alumno__nombres', 'profesor__email')
    exclude = ('profesor',)  # Esto es opcional si no quieres que aparezca en el formulario
