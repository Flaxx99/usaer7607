from django.contrib import admin
from .models import Asistencia
# Register your models here.

@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('profesor', 'fecha', 'presente', 'hora_entrada', 'hora_salida', 'escuela')
    list_filter = ('fecha', 'escuela', 'presente')
    search_fields = ('profesor__nombre', 'profesor__apellido_paterno', 'profesor__numero_empleado')
