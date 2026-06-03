# oficios/admin.py
from django.contrib import admin
from usuarios.admin_site import admin_site

from .models import Oficio


class OficioAdmin(admin.ModelAdmin):
    list_display = ("titulo", "subido_por", "fecha_subida")


admin_site.register(Oficio, OficioAdmin)
