# oficios/admin.py
from django.contrib import admin
from .models import Oficio

@admin.register(Oficio)
class OficioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'subido_por', 'fecha_subida')
