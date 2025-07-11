from django.contrib import admin
from .models import RegistroRAC

@admin.register(RegistroRAC)
class RegistroRACAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'fecha_registro', 'maestro_apoyo', 'escuela_regular', 'clasificacion')
    list_filter = ('fecha_registro', 'maestro_apoyo', 'escuela_regular', 'clasificacion')
    search_fields = ('alumno__nombres', 'alumno__apellido_paterno', 'maestro_apoyo__nombre')
    date_hierarchy = 'fecha_registro'