# oficios/admin.py
from django.contrib import admin
from .models import Oficio
from usuarios.admin_site import admin_site

class OficioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'subido_por', 'fecha_subida')

admin_site.register(Oficio, OficioAdmin)
