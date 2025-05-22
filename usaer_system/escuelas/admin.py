from django.contrib import admin
from .models import Escuela
# Register your models here.

@admin.register(Escuela)
class EscuelaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'clave', 'zona', 'telefono')
    search_fields = ('nombre', 'clave', 'zona')
